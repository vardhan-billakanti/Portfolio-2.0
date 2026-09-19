/**
 * PORTFOLIO 2.0 — BOB IMAGE SERVICE
 * 
 * Handles:
 * 1. Intent Classification: Distinguishes between normal questions (text),
 *    image search (free Wikimedia Commons/Wikipedia), and explicit image generation (Gemini).
 * 2. Free Image Search Provider: Completely free, legal, CC/Public Domain image search
 *    via Wikimedia Commons API with Wikipedia PageImages fallback. No API key required.
 * 3. Server-Side Gemini Image Generation: Secure generation using @google/genai SDK,
 *    strict quota protection, zero credential leakage, and clean fallback error handling.
 */

import https from 'https';
import { getAiClient } from './gemini-service.js';

/**
 * Classifies a user query into one of three distinct categories:
 * - 'image_generation': User explicitly asks to generate/create/make an image
 * - 'image_search': User asks to find/show/display existing images or requests "more"
 * - 'text': General questions, conversation, navigation, or inquiries
 * 
 * @param {string} rawText 
 * @param {Array<{role: string, content: string}>} [conversationHistory=[]]
 * @returns {{ mode: 'image_generation'|'image_search'|'text', prompt?: string, query?: string, isFollowUp?: boolean }}
 */
export function classifyBobRequest(rawText, conversationHistory = []) {
  if (!rawText || typeof rawText !== 'string') {
    return { mode: 'text' };
  }
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Helper to extract the most recent image search query from conversation history
  const getPreviousSearchTopic = () => {
    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) return null;
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const msg = conversationHistory[i];
      if (!msg || !msg.content) continue;

      // Check clean assistant message e.g. "Here are some tree images" or "Here are some more tree images"
      if (msg.role === 'assistant') {
        const m = msg.content.match(/Here are some (?:more )?([a-zA-Z0-9\s]+?) images/i);
        if (m && m[1]) return m[1].trim();
        const mLegacy = msg.content.match(/\[(?:Image Search|Found images for):?\s*\"?([^\"]+?)\"?\]/i);
        if (mLegacy && mLegacy[1]) return mLegacy[1].trim();
      }

      // Check previous user query e.g. "Find tree images" or "Show me monkeys"
      if (msg.role === 'user') {
        const userLower = msg.content.toLowerCase();
        if (
          (/\b(?:images?|pictures?|photos?|pics?)\b/i.test(userLower) || /^(?:show|find|search)\s+/i.test(userLower)) &&
          !/\b(?:generate|create|render|paint|draw|make)\b/i.test(userLower)
        ) {
          const cleaned = msg.content
            .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:show|find|search|display|look\s*up|get)(?:\s+me)?(?:\s+some|\s+an?|\s+the)?\s+/i, '')
            .replace(/^(?:images?|pictures?|photos?|pics?)\s+(?:of|for|about)?\s+/i, '')
            .replace(/\s+(?:images?|pictures?|photos?|pics?)\s*$/i, '')
            .trim();
          if (cleaned && cleaned.length >= 2 && !/^(?:more|another|next|show\s+more)$/i.test(cleaned)) {
            return cleaned;
          }
        }
      }
    }
    return null;
  };

  // 1. Follow-up inquiry or explanation about an image (treat as normal text response)
  if (
    /^(?:explain|describe|tell\s+me\s+about|what\s+is\s+in|why\s+did\s+you)\b.*\b(?:this|that|the|your)?\s*(?:generated\s+)?(?:image|picture|photo|illustration)\b/i.test(lower) ||
    /^(?:what|how|why)\b.*\b(?:image|picture)\b.*\b(?:mean|look|represent|is)\b/i.test(lower)
  ) {
    return { mode: 'text' };
  }

  // 2. Contextual "More" / Follow-Up Requests
  // Examples: "more", "show me more", "more trees", "show more pictures", "give me more images", "another one", "next"
  const isMorePhrase = (
    /^(?:more|show\s+(?:me\s+)?more|give\s+(?:me\s+)?more|see\s+more|next|load\s+more|more\s+please)$/i.test(lower) ||
    /^(?:more|show\s+(?:me\s+)?more|give\s+(?:me\s+)?more|see\s+more)\s+(?:images?|pictures?|photos?|pics?)$/i.test(lower) ||
    /^(?:more|show\s+more)\s+(?:of\s+)?([a-zA-Z0-9\s]+?)(?:\s+(?:images?|pictures?|photos?|pics?))?$/i.test(lower) ||
    /^([a-zA-Z0-9\s]+?)\s+(?:more\s+images?|more\s+pictures?)$/i.test(lower)
  );

  if (isMorePhrase) {
    let topic = null;
    const moreExplicit = text.match(/^(?:more|show\s+(?:me\s+)?more\s+(?:of\s+)?)\s*([a-zA-Z0-9\s]+?)(?:\s+(?:images?|pictures?|photos?|pics?))?$/i);
    if (moreExplicit && moreExplicit[1] && !/^(?:images?|pictures?|photos?|pics?|please)$/i.test(moreExplicit[1].trim())) {
      topic = moreExplicit[1].trim();
    } else {
      topic = getPreviousSearchTopic();
    }

    if (topic) {
      return { mode: 'image_search', query: topic, isFollowUp: true };
    }
  }

  // 3. Explicit Image Generation Request
  // Verbs: generate, create, make, render, paint, draw
  const genPattern = /\b(?:generate|create|make|render|paint|draw)\b/i;
  const imageNounPattern = /\b(?:images?|pictures?|photos?|wallpapers?|illustrations?|artworks?|posters?|drawings?|graphics?|avatars?)\b/i;

  const isExplicitGeneration = (
    (genPattern.test(lower) && imageNounPattern.test(lower)) ||
    /^(?:please\s+)?(?:generate|create|render|draw|paint)\s+(?:me\s+)?(?:a|an|the|some)?\s+/i.test(lower) ||
    /^(?:please\s+)?make\s+(?:me\s+)?(?:a|an|the|some)?\s+.*(?:robot|avatar|wallpaper|illustration|artwork|poster|character|scene|city|landscape)/i.test(lower)
  );

  if (isExplicitGeneration) {
    let prompt = text
      .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:generate|create|render|paint|draw|make)(?:\s+me)?(?:\s+an?|\s+the|\s+some)?(?:\s+image|\s+picture|\s+photo|\s+wallpaper|\s+illustration|\s+artwork)?(?:\s+of)?/i, '')
      .replace(/\b(?:image|picture|photo|wallpaper|illustration|artwork)\s*$/i, '')
      .trim();

    prompt = prompt.replace(/^(?:a|an|the|some)\s+/i, '').trim();

    if (!prompt || prompt.length < 2) {
      prompt = text;
    }
    return { mode: 'image_generation', prompt };
  }

  // 4. Image Search Phrasing Check
  // Examples: "Show me images of a monkey", "Find pictures of Hyderabad", "Show me some cybersecurity images", "Find images of a laptop"
  const isSearchRequest = (
    /\b(?:show|find|search|display|look\s*up|get)\b.*\b(?:images?|pictures?|photos?|pics?)\b/i.test(lower) ||
    /^(?:images?|pictures?|photos?|pics?)\s+(?:of|for|about)\b/i.test(lower) ||
    /\b(?:images?|pictures?|photos?|pics?)\s+(?:search|results?)\b/i.test(lower)
  );

  if (isSearchRequest) {
    let query = text
      .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:show|find|search|display|look\s*up|get)(?:\s+me)?(?:\s+some|\s+an?|\s+the)?\s+(?:images?|pictures?|photos?|pics?)(?:\s+of|\s+for|\s+about)?/i, '')
      .replace(/^(?:images?|pictures?|photos?|pics?)\s+(?:of|for|about)\s+/i, '')
      .replace(/\s+(?:images?|pictures?|photos?|pics?)\s*$/i, '')
      .trim();

    // If query ends with "images/pictures" e.g., "Show me some cybersecurity images"
    const matchBefore = text.match(/(?:show|find|search|get|display)\s+(?:me\s+)?(?:some\s+|an?\s+|the\s+)?(.*?)\s+(?:images?|pictures?|photos?|pics?)/i);
    if (matchBefore && matchBefore[1] && (!query || query === text || query.startsWith('show') || query.startsWith('find'))) {
      query = matchBefore[1].trim();
    }

    // Clean leading command verbs from query if "images" was at the end
    query = query.replace(/^(?:show|find|search|display|look\s*up|get)(?:\s+me)?(?:\s+some|\s+an?|\s+the)?\s+/i, '').trim();

    // Clean articles & pronouns from query
    query = query.replace(/^(?:a|an|the|some|me)\s+/i, '').trim();

    if (!query || query.length < 2) {
      query = text.replace(/^(?:show|find|search)\s+(?:me\s+)?/i, '').trim();
    }
    return { mode: 'image_search', query };
  }

  // 5. Default: Normal Question
  return { mode: 'text' };
}

/**
 * Searches free, public domain and CC-licensed images via Wikimedia Commons and Wikipedia APIs.
 * 
 * @param {string} query 
 * @param {number} [offset=0]
 * @returns {Promise<Array<{ title: string, url: string, sourceUrl: string, width?: number, height?: number }>>}
 */
export async function searchFreeImages(query, offset = 0) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const cleanQuery = query.trim().slice(0, 100);

  try {
    const commonsResults = await fetchWikimediaCommons(cleanQuery, offset);
    if (commonsResults && commonsResults.length > 0) {
      return commonsResults.slice(0, 8);
    }
  } catch (err) {
    console.warn('[BOB Image Search] Wikimedia Commons search failed:', err.message);
  }

  // Fallback to Wikipedia PageImages API
  try {
    const wikiResults = await fetchWikipediaPageImages(cleanQuery, offset);
    if (wikiResults && wikiResults.length > 0) {
      return wikiResults.slice(0, 8);
    }
  } catch (err) {
    console.warn('[BOB Image Search] Wikipedia PageImages fallback failed:', err.message);
  }

  return [];
}

/**
 * Query Wikimedia Commons API for media files with pagination support
 */
function fetchWikimediaCommons(query, offset = 0) {
  return new Promise((resolve) => {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&gsroffset=${offset || 0}&prop=imageinfo&iiprop=url|thumburl|size&iiurlwidth=450&format=json`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Portfolio2-BOB/1.0 (https://vardhanbillakanti.in; contact: vardhanbillakanti125@gmail.com)'
      },
      timeout: 6000
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve([]);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages || {};
          const results = [];

          for (const id in pages) {
            const page = pages[id];
            const info = page.imageinfo?.[0];
            const thumbUrl = info?.thumburl || info?.url;

            if (thumbUrl && thumbUrl.startsWith('https://')) {
              // Format clean title
              const cleanTitle = (page.title || '')
                .replace(/^File:/i, '')
                .replace(/\.[^/.]+$/, '')
                .replace(/_/g, ' ')
                .slice(0, 60);

              results.push({
                title: cleanTitle || 'Image',
                url: thumbUrl,
                sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                width: info.thumbwidth || 400,
                height: info.thumbheight || 300
              });
            }
          }
          resolve(results);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Query Wikipedia PageImages API as fallback with pagination support
 */
function fetchWikipediaPageImages(query, offset = 0) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&gsroffset=${offset || 0}&prop=pageimages|info&inprop=url&pithumbsize=450&format=json`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Portfolio2-BOB/1.0 (https://vardhanbillakanti.in; contact: vardhanbillakanti125@gmail.com)'
      },
      timeout: 6000
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve([]);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages || {};
          const results = [];

          for (const id in pages) {
            const page = pages[id];
            if (page.thumbnail?.source && page.thumbnail.source.startsWith('https://')) {
              results.push({
                title: page.title || 'Image',
                url: page.thumbnail.source,
                sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
                width: page.thumbnail.width || 400,
                height: page.thumbnail.height || 300
              });
            }
          }
          resolve(results);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Generates an image with Google Gemini GenAI SDK on the server.
 * Returns data URL on success, or detailed diagnostic error message on failure.
 * 
 * @param {Object} options
 * @param {string} options.prompt
 * @param {string} options.apiKey
 * @returns {Promise<{ success: boolean, prompt: string, imageData?: string, mimeType?: string, error?: string, errorDetails?: string }>}
 */
export async function generateGeminiImage({ prompt, apiKey }) {
  if (!apiKey) {
    const err = 'API Key missing: GEMINI_API_KEY environment variable is not configured.';
    console.error('[BOB Image Generation]', err);
    return {
      success: false,
      prompt,
      error: "I couldn't generate that image right now. Please try again.",
      errorDetails: err
    };
  }

  const ai = getAiClient(apiKey);

  // Candidate image generation models supported by Google GenAI Developer API
  const candidateModels = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3-pro-image'
  ];

  let lastError = null;
  let failedModel = candidateModels[0];

  for (const model of candidateModels) {
    try {
      failedModel = model;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 18000); // 18s generation timeout

      const res = await ai.models.generateContent({
        model,
        contents: `Generate an image based on this description: ${prompt}`,
        config: {
          abortSignal: abortController.signal
        }
      });

      clearTimeout(timeoutId);

      const candidate = res.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const imageData = `data:${mimeType};base64,${part.inlineData.data}`;
            return {
              success: true,
              prompt,
              imageData,
              mimeType
            };
          }
        }
      }
    } catch (err) {
      lastError = err;
      const statusCode = err?.status || err?.code || 429;
      const msg = err?.message || String(err);

      // Log exact technical error to server console in development
      console.error(`[BOB Image Generation Backend Error] Model: ${model} | HTTP ${statusCode} | ${msg.slice(0, 240)}`);

      // If quota/billing limit (429 RESOURCE_EXHAUSTED / limit: 0), break immediately
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('limit: 0')) {
        break;
      }
    }
  }

  const rawMsg = lastError?.message || 'Unknown error';
  const statusCode = lastError?.status || lastError?.code || 429;
  const isQuota0 = rawMsg.includes('limit: 0') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429');

  const detailedReason = isQuota0
    ? `Gemini Image Model '${failedModel}' returned HTTP 429 RESOURCE_EXHAUSTED (Quota limit is 0 on Google AI Studio Free Tier). Image generation models require pay-as-you-go billing enabled in Google AI Studio.`
    : `Gemini Image Model '${failedModel}' failed (HTTP ${statusCode}): ${rawMsg.slice(0, 180)}`;

  console.error(`[BOB Image Generation Diagnostic] ${detailedReason}`);

  return {
    success: false,
    prompt,
    error: "I couldn't generate that image right now. Please try again.",
    errorDetails: detailedReason
  };
}
