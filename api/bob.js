/**
 * Vercel Serverless Function — BOB AI API Endpoint (/api/bob)
 * Production-ready, secure streaming endpoint with rate limiting,
 * CORS restriction, payload validation, health checks, and sanitized error masking.
 */

import { streamGeminiResponse } from '../src/server/gemini-service.js';
import { rateLimiter } from '../src/server/rate-limiter.js';
import { classifyBobRequest, searchFreeImages, generateGeminiImage } from '../src/server/bob-image-service.js';

/**
 * Validates request origins against allowed production and preview hosts.
 * Dynamically recognizes same-host requests, any .vercel.app deployment,
 * the official domain, and local loopback.
 */
function isOriginAllowed(origin, req) {
  if (!origin) return true; // Direct/same-origin navigation or server-to-server
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;
    const reqHost = req?.headers?.host || req?.headers?.['x-forwarded-host'];

    // 1. Same-host request is always allowed
    if (reqHost && (originHost === reqHost || reqHost.startsWith(originHost))) {
      return true;
    }

    // 2. All Vercel deployments (production, preview, branch previews, custom team subdomains)
    if (originUrl.hostname.endsWith('.vercel.app')) {
      return true;
    }

    // 3. Official portfolio domain and subdomains
    if (originUrl.hostname === 'vardhanbillakanti.in' || originUrl.hostname.endsWith('.vardhanbillakanti.in')) {
      return true;
    }

    // 4. Localhost and local loopback for development/testing
    if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
      return true;
    }
  } catch (e) {
    // Malformed origin
  }
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. CORS Origin Validation
  if (origin && !isOriginAllowed(origin, req)) {
    return res.status(403).json({ error: 'Access forbidden from this origin' });
  }

  if (origin && isOriginAllowed(origin, req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // 2. OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. Health check GET handler (safe: never leaks key value, returns boolean hasGeminiKey)
  if (req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    return res.status(200).json({
      status: 'ok',
      service: 'bob-ai',
      hasGeminiKey: hasKey,
      timestamp: new Date().toISOString()
    });
  }

  // 4. Strict Method Check for chat requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 5. Rate Limiting Check
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                   req.socket?.remoteAddress || 
                   '127.0.0.1';
  const rateCheck = rateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter || 5));
    return res.status(429).json({
      error: rateCheck.message || 'Rate limit reached. Please wait a moment.'
    });
  }

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data || '{}');
      } catch (e) {
        data = {};
      }
    } else if (!data || typeof data !== 'object') {
      data = {};
    }

    const messages = data.messages;

    // 6. Input Validation
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: 'Invalid messages array (must contain 1 to 20 messages)' });
    }

    for (const m of messages) {
      if (!m || typeof m !== 'object' || typeof m.content !== 'string' || !['user', 'assistant', 'model'].includes(m.role)) {
        return res.status(400).json({ error: 'Invalid message object format' });
      }
      if (m.content.length > 1500) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 1,500 characters' });
      }
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      console.error('[BOB Serverless Error] GEMINI_API_KEY environment variable is not configured');
      return res.status(500).json({ error: 'BOB service is temporarily unavailable.' });
    }

    // 7. Setup SSE Headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    if (req.socket && typeof req.socket.setNoDelay === 'function') {
      req.socket.setNoDelay(true);
    }

    let isClientConnected = true;
    req.on('close', () => {
      isClientConnected = false;
    });

    // Classify request intent: text vs image_search vs image_generation (with conversation history context)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMsg?.content || '';
    const classification = classifyBobRequest(userText, messages);

    // A. FREE IMAGE SEARCH DISPATCH
    if (classification.mode === 'image_search') {
      try {
        const searchQuery = classification.query || userText;

        // Calculate offset for follow-up "more" searches
        let offset = 0;
        if (classification.isFollowUp) {
          const topicLower = searchQuery.toLowerCase();
          let searchCount = 0;
          for (const m of messages) {
            if (m.role === 'assistant' && m.content && m.content.toLowerCase().includes(topicLower)) {
              searchCount++;
            }
          }
          offset = Math.min(searchCount * 8, 40);
        }

        const images = await searchFreeImages(searchQuery, offset);
        const heading = classification.isFollowUp
          ? `Here are some more ${searchQuery} images:`
          : `Here are some ${searchQuery} images:`;

        if (isClientConnected) {
          res.write(`data: ${JSON.stringify({
            type: 'image_search',
            query: searchQuery,
            heading,
            isFollowUp: !!classification.isFollowUp,
            images
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      } catch (searchErr) {
        console.warn('[BOB Serverless] Image search error:', searchErr.message);
        if (isClientConnected) {
          res.write(`data: ${JSON.stringify({
            type: 'image_search',
            query: classification.query || userText,
            heading: `Here are some ${classification.query || userText} images:`,
            isFollowUp: false,
            images: []
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      }
    }

    // B. EXPLICIT IMAGE GENERATION DISPATCH
    if (classification.mode === 'image_generation') {
      try {
        const genPrompt = classification.prompt || userText;
        const result = await generateGeminiImage({ prompt: genPrompt, apiKey });
        if (isClientConnected) {
          if (result.success) {
            res.write(`data: ${JSON.stringify({
              type: 'image_generation',
              prompt: result.prompt,
              imageData: result.imageData,
              mimeType: result.mimeType
            })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({
              type: 'image_generation_error',
              error: result.error || "I couldn't generate that image right now. Please try again.",
              errorDetails: result.errorDetails || null
            })}\n\n`);
          }
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      } catch (genErr) {
        console.error('[BOB Serverless] Image generation exception:', genErr?.message || genErr);
        if (isClientConnected) {
          res.write(`data: ${JSON.stringify({
            type: 'image_generation_error',
            error: "I couldn't generate that image right now. Please try again.",
            errorDetails: genErr?.message || String(genErr)
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      }
    }

    // C. NORMAL QUESTIONS / TEXT STREAM
    try {
      for await (const chunk of streamGeminiResponse({ messages, apiKey, model: 'gemini-3.5-flash-lite' })) {
        if (!isClientConnected) break;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      }

      if (isClientConnected) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (streamErr) {
      console.error('[BOB Serverless] Gemini streaming error:', streamErr?.message || streamErr);
      if (isClientConnected) {
        res.write(`data: ${JSON.stringify({ error: "Sorry bro, I couldn't reach BOB right now. Try again." })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  } catch (err) {
    console.error('[BOB Serverless] Handler error:', err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Sorry bro, I couldn't reach BOB right now. Try again." });
    }
  }
}
