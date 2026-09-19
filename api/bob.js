/**
 * Vercel Serverless Function — BOB AI API Endpoint (/api/bob)
 * Production-ready, secure streaming endpoint with rate limiting,
 * CORS restriction, payload validation, and sanitized error masking.
 */

import { streamGeminiResponse } from '../src/server/gemini-service.js';
import { rateLimiter } from '../src/server/rate-limiter.js';
import { classifyBobRequest, searchFreeImages, generateGeminiImage } from '../src/server/bob-image-service.js';

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/(?:www\.)?vardhanbillakanti\.in$/,
  /^https:\/\/portfolio-2-0[a-z0-9-]*\.vercel\.app$/,
  /^https:\/\/vardhanbillakanti[a-z0-9-]*\.vercel\.app$/
];

function isOriginAllowed(origin) {
  if (!origin) return true; // Direct/same-origin navigation
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. CORS Origin Validation
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Access forbidden from this origin' });
  }

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  // 2. OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. Strict Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 4. Rate Limiting Check
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
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const messages = data.messages;

    // 5. Input Validation
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

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'BOB service is temporarily unavailable.' });
    }

    // 6. Setup SSE Headers
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
        console.warn('[BOB Serverless] Image search failed:', searchErr.message);
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
        console.error('[BOB Serverless] Image generation exception:', genErr);
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
      console.warn('[BOB Serverless] Gemini call failed safely');
      if (isClientConnected) {
        res.write(`data: ${JSON.stringify({ error: "Sorry bro, I couldn't reach BOB right now. Try again." })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: "Sorry bro, I couldn't reach BOB right now. Try again." });
    }
  }
}
