import { defineConfig, loadEnv } from 'vite';
import { streamGeminiResponse } from './src/server/gemini-service.js';
import { rateLimiter } from './src/server/rate-limiter.js';
import { classifyBobRequest, searchFreeImages, generateGeminiImage } from './src/server/bob-image-service.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function isOriginAllowed(origin, req) {
  if (!origin) return true; // Direct/same-origin navigation
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;
    const reqHost = req?.headers?.host || req?.headers?.['x-forwarded-host'];
    if (reqHost && (originHost === reqHost || reqHost.startsWith(originHost))) return true;
    if (originUrl.hostname.endsWith('.vercel.app')) return true;
    if (originUrl.hostname === 'vardhanbillakanti.in' || originUrl.hostname.endsWith('.vardhanbillakanti.in')) return true;
    if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') return true;
  } catch (e) {}
  return false;
}

export default defineConfig(({ mode }) => {
  // Load environment variables securely from .env and .env.local without exposing to client
  const env = loadEnv(mode, process.cwd(), '');
  const serverApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    server: {
      port: 5173,
      open: false,
      host: true
    },
    plugins: [
      {
        name: 'security-headers-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Apply defensive security headers to all responses
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
            next();
          });
        }
      },
      {
        name: 'bob-gemini-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.originalUrl || req.url;
            // Support /api/bob as primary endpoint, plus /api/bob-chat and /api/node-chat aliases
            const isBobEndpoint = url === '/api/bob' || 
              url.startsWith('/api/bob?') || 
              url.startsWith('/api/bob-chat') || 
              url.startsWith('/api/node-chat');

            if (!isBobEndpoint) {
              return next();
            }

            const origin = req.headers.origin;

            // 1. CORS Origin Validation
            if (origin && !isOriginAllowed(origin, req)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Access forbidden from this origin' }));
            }

            if (origin && isOriginAllowed(origin, req)) {
              res.setHeader('Access-Control-Allow-Origin', origin);
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              res.setHeader('Vary', 'Origin');
            } else {
              res.setHeader('Access-Control-Allow-Origin', '*');
            }

            // 2. Handle OPTIONS preflight
            if (req.method === 'OPTIONS') {
              res.writeHead(204);
              return res.end();
            }

            // 3. Safe Health Check GET Handler
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                status: 'ok',
                service: 'bob-ai',
                hasGeminiKey: Boolean(serverApiKey && serverApiKey.trim().length > 0),
                timestamp: new Date().toISOString()
              }));
            }

            // 4. Strict Method Restriction
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            }

            // 4. Rate Limiting Protection
            const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                             req.socket?.remoteAddress || 
                             '127.0.0.1';
            const rateCheck = rateLimiter.check(clientIp);
            if (!rateCheck.allowed) {
              res.writeHead(429, {
                'Content-Type': 'application/json',
                'Retry-After': String(rateCheck.retryAfter || 5)
              });
              return res.end(JSON.stringify({
                error: rateCheck.message || 'Rate limit reached. Please wait a moment.'
              }));
            }

            const reqStartTime = Date.now();
            try {
              // 5. Buffer & parse incoming payload with size limit (max 64KB)
              const MAX_PAYLOAD_BYTES = 65536;
              let totalBytes = 0;
              const chunks = [];

              for await (const chunk of req) {
                totalBytes += chunk.length;
                if (totalBytes > MAX_PAYLOAD_BYTES) {
                  res.writeHead(413, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ error: 'Payload Too Large (max 64KB)' }));
                }
                chunks.push(chunk);
              }

              const bodyStr = Buffer.concat(chunks).toString('utf8');
              let data = {};
              try {
                data = JSON.parse(bodyStr || '{}');
              } catch (parseErr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
              }

              const messages = data.messages;

              // 6. Strict Input Validation
              if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid messages array (must contain 1 to 20 messages)' }));
              }

              for (const m of messages) {
                if (!m || typeof m !== 'object' || typeof m.content !== 'string' || !['user', 'assistant', 'model'].includes(m.role)) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ error: 'Invalid message object format' }));
                }
                if (m.content.length > 1500) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ error: 'Message exceeds maximum length of 1,500 characters' }));
                }
              }

              // 7. Setup Server-Sent Events (SSE) stream headers
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

              // Check current server-side API key
              const currentEnv = loadEnv(mode, process.cwd(), '');
              const apiKey = currentEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY || serverApiKey;

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
                  console.warn('[BOB] Image search failed:', searchErr.message);
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
                  console.error('[BOB] Image generation exception:', genErr);
                  if (isClientConnected) {
                    res.write(`data: ${JSON.stringify({
                      type: 'image_generation_error',
                      error: "I couldn't generate that image right now. Please try again.",
                      errorDetails: genErr?.message || String(genErr)
                    })}\n\n`);
                    res.write(`data: ${JSON.stringify({
                      type: 'image_generation_error',
                      error: "I couldn't generate that image right now. Please try again."
                    })}\n\n`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                  }
                  return;
                }
              }

              // C. NORMAL QUESTIONS / TEXT STREAM
              if (apiKey && apiKey.trim() !== '') {
                try {
                  const geminiStartTime = Date.now();
                  let isFirstChunk = true;

                  for await (const chunk of streamGeminiResponse({ messages, apiKey, model: 'gemini-3.5-flash-lite' })) {
                    if (!isClientConnected) break;
                    if (isFirstChunk) {
                      isFirstChunk = false;
                    }
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                    if (typeof res.flush === 'function') {
                      res.flush();
                    }
                  }

                  if (isClientConnected) {
                    res.write('data: [DONE]\n\n');
                    res.end();
                  }
                  return;
                } catch (geminiErr) {
                  // Controlled error response without internal stack traces
                  console.warn('[BOB] Gemini call failed safely');
                  if (isClientConnected) {
                    res.write(`data: ${JSON.stringify({ error: "Sorry bro, I couldn't reach BOB right now. Try again." })}\n\n`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                  }
                  return;
                }
              }

              // Server configuration error (mask details from client)
              if (isClientConnected) {
                res.write(`data: ${JSON.stringify({ error: "BOB service is temporarily unavailable." })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
              }
            } catch (err) {
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Sorry bro, I couldn't reach BOB right now. Try again." }));
              }
            }
          });
        }
      }
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          projects: resolve(__dirname, 'projects.html'),
        }
      }
    }
  };
});
