/**
 * PORTFOLIO 2.0 — DYNAMIC CONVERSATIONAL BOB ASSISTANT RESPONDER
 * 
 * Master Natural Language Understanding & Knowledge Engine:
 *   1. Understand user intent + conversation context + response appropriateness.
 *   2. Understand informal spelling, slang, contractions, and casual grammar naturally.
 *   3. Friendly, warm, natural conversational personality (never robotic, never corporate).
 *   4. DO NOT over-interpret casual phrases as technical queries (e.g. "how are you bro", "what's up", "nice").
 *   5. Internal 15-category intent classification.
 *   6. Multi-level cybersecurity & technical knowledge (concise definitions vs deep breakdowns).
 *   7. Full verified portfolio & project knowledge from https://vardhanbillakanti.in.
 *   8. Hybrid intelligence & smart context retrieval.
 *   9. Zero hallucination, zero generic software protocol templates.
 * 
 * Source of Truth: https://vardhanbillakanti.in
 */

import { PORTFOLIO_KNOWLEDGE } from './portfolio-knowledge.js';
import { SAFE_NAV_MAP, detectNavigationIntent } from './bob-navigation.js';

export { SAFE_NAV_MAP, detectNavigationIntent };

/**
 * Standard project display order for ordinal resolution
 */
export const ORDERED_PROJECT_IDS = [
  'vaultix',
  'doomchat',
  'mycloudstore',
  'explore-the-globe',
  'toolock',
  'resuvana',
  'cookpro',
  'portfolio'
];

/**
 * Normalizes informal spelling, elongated slang, chat abbreviations, and minor typos
 */
export function normalizeCasualText(rawText) {
  if (!rawText) return '';
  let text = rawText.trim().toLowerCase();

  // Normalize repeated trailing characters (e.g. "brooo" -> "bro", "heyyy" -> "hey", "plzzz" -> "please")
  text = text.replace(/\bbroo+\b/g, 'bro');
  text = text.replace(/\byooo+\b/g, 'yo');
  text = text.replace(/\bheyy+\b/g, 'hey');
  text = text.replace(/\bhiii+\b/g, 'hi');
  text = text.replace(/\bhahaa+\b/g, 'haha');
  text = text.replace(/\bcoool+\b/g, 'cool');
  text = text.replace(/\bnicee+\b/g, 'nice');
  text = text.replace(/\bsooo+\b/g, 'so');
  text = text.replace(/\bdamnn+\b/g, 'damn');

  // Slang & chat short forms
  text = text.replace(/\bhow\s+r\s+u\b/g, 'how are you');
  text = text.replace(/\bhow\s+r\s+you\b/g, 'how are you');
  text = text.replace(/\bhow\s+are\s+u\b/g, 'how are you');
  text = text.replace(/\bhow's\s+it\s+going\b/g, 'how is it going');
  text = text.replace(/\bhows\s+it\s+going\b/g, 'how is it going');
  text = text.replace(/\bwassup\b|\bwazzup\b|\bwhatsup\b|\bwhat's\s+up\b|\bwhats\s+up\b/g, 'what is up');
  text = text.replace(/\bwhat's\b/g, 'what is');
  text = text.replace(/\bwhats\b/g, 'what is');
  text = text.replace(/\bu\b/g, 'you');
  text = text.replace(/\bur\b/g, 'your');
  text = text.replace(/\bpls\b|\bplz\b/g, 'please');
  text = text.replace(/\bthx\b|\bty\b/g, 'thanks');
  text = text.replace(/\bcya\b/g, 'see you');
  text = text.replace(/\bgoodnite\b/g, 'good night');
  text = text.replace(/\bgonna\b/g, 'going to');
  text = text.replace(/\bwanna\b/g, 'want to');
  text = text.replace(/\blemme\b/g, 'let me');
  text = text.replace(/\babt\b/g, 'about');
  text = text.replace(/\bhw\b/g, 'how');
  text = text.replace(/\bwrk\b/g, 'work');
  text = text.replace(/\bcyber\s+secrity\b/g, 'cybersecurity');
  text = text.replace(/\bcybersec\b/g, 'cybersecurity');

  return text;
}

/**
 * Robust natural language arithmetic evaluator
 */
export function solveMathExpression(rawText) {
  if (!rawText) return null;
  let text = rawText.trim().toLowerCase();

  // Strip leading question wrappers
  text = text.replace(/^(?:what\s+is|what's|whats|tell\s+me|calculate|compute|solve|how\s+much\s+is|evaluate|value\s+of)\s+/i, '');
  text = text.replace(/\s*(=|equals?|\?|!|\.)+$/g, '');
  text = text.trim();

  // Percentage pattern: "20% of 150"
  const pctMatch = text.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)$/);
  if (pctMatch) {
    const p = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = (p / 100) * total;
    return `${Number.isInteger(res) ? res : Number(res.toFixed(4))}.`;
  }

  // Square root: "square root of 64", "sqrt 144"
  const sqrtMatch = text.match(/^(?:square\s+root\s+of|sqrt\(?)\s*(\d+(?:\.\d+)?)\)?$/);
  if (sqrtMatch) {
    const val = Math.sqrt(parseFloat(sqrtMatch[1]));
    return `${Number.isInteger(val) ? val : Number(val.toFixed(4))}.`;
  }

  // Replace operator words and symbols
  let expr = text
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\b(times|multiplied\s+by)\b/g, '*')
    .replace(/×/g, '*')
    .replace(/\b(divided\s+by|over)\b/g, '/')
    .replace(/÷/g, '/')
    .replace(/\b(to\s+the\s+power\s+of|raised\s+to)\b/g, '^')
    .replace(/\b(modulo|mod)\b/g, '%');

  // Handle "x" between digits
  expr = expr.replace(/(\d)\s*x\s*(\d)/gi, '$1 * $2');

  // Validate math string
  if (/^[\d\s\+\-\*\/\^\%\(\)\.]+$/.test(expr) && /\d/.test(expr)) {
    try {
      const jsExpr = expr.replace(/\^/g, '**');
      if (/^[0-9\s\+\-\*\/\(\)\.]+(\*\*[0-9\s\+\-\*\/\(\)\.]+)?$/.test(jsExpr)) {
        const result = Function(`'use strict'; return (${jsExpr});`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          const formatted = Number.isInteger(result) ? result : Number(result.toFixed(6));
          return `${formatted}.`;
        } else if (result === Infinity || result === -Infinity) {
          return "Undefined (division by zero).";
        }
      }
    } catch (err) {}
  }

  return null;
}

/**
 * Explains previous arithmetic steps ("Why is 9 the answer?", "Why 9?")
 */
export function explainMathCalculation(userText, messages) {
  const lower = userText.toLowerCase();
  const isAskingWhy = /\b(?:why|how\s+did\s+you\s+get|explain\s+(?:why|how)|show\s+working)\b/i.test(lower);
  if (!isAskingWhy) return null;

  for (let i = messages.length - 2; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      const trimmed = (msg.content || '').trim().replace(/\.$/, '');
      if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        const resultNum = trimmed;
        const prevUserMsg = messages[i - 1]?.content || '';
        const prevLower = prevUserMsg.toLowerCase();

        const divMatch = prevLower.match(/(\d+(?:\.\d+)?)\s*(?:divided\s+by|\/|÷)\s*(\d+(?:\.\d+)?)/);
        if (divMatch) {
          return `${divMatch[1]} divided by ${divMatch[2]} equals ${resultNum} because ${resultNum} × ${divMatch[2]} = ${divMatch[1]}.`;
        }

        const mulMatch = prevLower.match(/(\d+(?:\.\d+)?)\s*(?:\*|×|x|times|multiplied\s+by)\s*(\d+(?:\.\d+)?)/);
        if (mulMatch) {
          return `${mulMatch[1]} multiplied by ${mulMatch[2]} equals ${resultNum}.`;
        }

        const addMatch = prevLower.match(/(\d+(?:\.\d+)?)\s*(?:\+|plus)\s*(\d+(?:\.\d+)?)/);
        if (addMatch) {
          return `${addMatch[1]} plus ${addMatch[2]} equals ${resultNum}.`;
        }

        const subMatch = prevLower.match(/(\d+(?:\.\d+)?)\s*(?:\-|minus)\s*(\d+(?:\.\d+)?)/);
        if (subMatch) {
          return `${subMatch[1]} minus ${subMatch[2]} equals ${resultNum}.`;
        }

        return `That's calculated from your previous question (${prevUserMsg.trim()}), which evaluates to ${resultNum}.`;
      }
    }
  }

  return null;
}

/**
 * Classifies the visitor's intent internally into one of 15 core categories
 */
export function classifyIntent(userText, lower, norm, prevContext, messages) {
  if (detectJayaDefenseRoastClaim(userText) !== null) return 'JAYA_DEFENSE';
  if (explainMathCalculation(userText, messages) !== null) return 'LOGIC';
  if (solveMathExpression(userText) !== null) return 'MATH';

  // Goodbye / exit
  if (/\b(?:bye|goodbye|cya|see\s+ya|see\s+you|gotta\s+go|heading\s+out|talk\s+later)\b/i.test(norm) ||
      (norm.includes('work') && (norm.includes('some work') || norm.includes('work to do') || norm.includes('got work')))) {
    return 'GOODBYE';
  }

  // How are you / status
  if (/\bhow\s+(?:are\s+you|are\s+u|is\s+it\s+going|are\s+things|is\s+everything)\b/i.test(norm) ||
      /\bwhat\s+is\s+up\b/i.test(norm) || /^(?:sup|yo)\b/i.test(norm)) {
    return 'CASUAL CONVERSATION';
  }

  // Greetings
  if (/^(?:hi|hello|hey|greetings|hola|good\s+(?:morning|afternoon|evening))\b/i.test(norm)) {
    return 'GREETING';
  }

  // Casual reactions / mood sharing
  if (/^(?:i'?m|i\s+am)\s+(?:good|fine|doing\s+good|doing\s+well|great|okay|alright)\b/i.test(norm) ||
      /^(?:good|all\s+good|doing\s+good)\b/i.test(norm) ||
      /^(?:nicee?|cool|awesome|dope|damn|that's\s+cool|that's\s+sick|sick|good\s+one|haha|lol|rofl|fr|really\?|no\s+way|bro+)\b/i.test(norm) ||
      /\b(?:thanks|thank\s+you|thx|ty)\b/i.test(norm)) {
    return 'CASUAL CONVERSATION';
  }

  // Ambiguity / Clarification request
  if (/^(?:tell\s+me\s+about\s+that|explain\s+that|what\s+is\s+this)\??$/i.test(norm) ||
      /\b(?:what\s+do\s+you\s+mean|what\s+does\s+that\s+mean|clarify)\b/i.test(norm)) {
    return 'CLARIFICATION';
  }

  // Opinions / Recommendations
  if (/\b(?:most\s+technically\s+interesting|recommend\s+a\s+project|best\s+project|favorite\s+project)\b/i.test(norm)) {
    return 'OPINION';
  }

  // Specific project queries & encryption hybrid
  if (/\b(?:vaultix|doomchat|doom\s+chat|mycloudstore|explore\s+the\s+globe|explore\s+globe|toolock|resuvana|cookpro)\b/i.test(norm) ||
      /\b(?:projects?\s+uses?\s+encryption|which\s+project\s+uses\s+encryption)\b/i.test(norm)) {
    return 'PROJECT';
  }

  // General portfolio & author inquiries
  if (/\b(?:who\s+is\s+jaya|tell\s+me\s+about\s+jaya|jaya\s+vardhan|all\s+projects|what\s+projects|academic|education|toolkit|skills|certif|lorven|founder)\b/i.test(norm)) {
    return 'PORTFOLIO';
  }

  // Follow-up context queries ("it", "explain it more", "tell me more")
  if (/^(?:explain\s+it\s+more|tell\s+me\s+more|explain\s+more|go\s+deeper|more\s+details|how\s+does\s+it\s+work|why\s+did\s+he\s+build\s+it|what\s+technologies\s+does\s+it\s+use)\b/i.test(norm)) {
    return 'FOLLOW-UP';
  }

  // Cybersecurity concepts
  if (/\b(?:phishing|malware|ransomware|firewall|vpn|encryption|decryption|hashing|zero\s+trust|mfa|cia\s+triad|sql\s+injection|xss|csrf|cryptography)\b/i.test(norm)) {
    return 'CYBERSECURITY';
  }

  // Technology & Systems
  if (/\b(?:api|operating\s+system|linux|docker|kubernetes|cloud\s+computing|database|sql\s*vs\s*nosql|websocket)\b/i.test(norm)) {
    return 'TECHNOLOGY';
  }

  // Programming & CS
  if (/\b(?:recursion|algorithm|data\s+structure|compiler|git|version\s+control)\b/i.test(norm)) {
    return 'PROGRAMMING';
  }

  // General science / knowledge
  if (/\b(?:gravity|sky\s+blue|photosynthesis|speed\s+of\s+light|who\s+invented\s+the\s+internet|dns|ip\s+address)\b/i.test(norm)) {
    return 'GENERAL KNOWLEDGE';
  }

  return 'OTHER';
}

/**
 * Detects casual status queries: "how are u broo", "how are you bro", "whats up", etc.
 */
export function detectHowAreYou(text, norm, isBro) {
  const isStatusQuery = 
    /\bhow\s+(?:are\s+you|are\s+u|is\s+it\s+going|are\s+things|is\s+everything|do\s+you\s+do)\b/i.test(norm) ||
    /\bwhat\s+is\s+up\b/i.test(norm) ||
    /^(?:sup|yo)\b/i.test(norm);

  if (!isStatusQuery) return null;

  if (isBro) {
    return "Nicee, I'm fine bro 😄 What about you?";
  }

  if (norm.includes('what is up')) {
    return "Doing good 😄 What's up?";
  }

  return "Nicee, I'm fine 😄 What about you?";
}

/**
 * Detects visitor mood / state response: "im good", "i'm fine", "doing well"
 */
export function detectUserMoodOrState(text, norm, isBro) {
  if (/^(?:i'?m|i\s+am)\s+(?:good|fine|doing\s+good|doing\s+well|great|okay|alright)\b/i.test(norm) ||
      /^(?:good|all\s+good|doing\s+good|doing\s+well)\b/i.test(norm)) {
    return isBro ? "Glad to hear that bro 😄" : "Glad to hear that 😄";
  }
  return null;
}

/**
 * Detects casual first-person self-identification vs third-person or portfolio queries
 */
export function detectSelfIdentification(text, norm, isBro) {
  // Guard against actual questions or portfolio lookups
  if (/\b(?:who\s+is|who\s+was|tell\s+me\s+about|what\s+about|what\s+has|what\s+are|what\s+is|where\s+does|where\s+do|how\s+does|explain|show\s+me|list)\b/i.test(norm)) {
    return null;
  }
  if (/\b(?:projects?|certif|credential|email|mail|college|school|study|studying|education|github|linkedin|instagram|skills|toolkit|lorven)\b/i.test(norm)) {
    return null;
  }

  // 1. "hi im jaya vardhan myself" / "im jaya vardhan myself"
  if (/\b(?:myself\s+)?(?:i\s*am|i'?m|im)\s+jaya(?:\s+vardhan)?\s+myself\b/i.test(norm) ||
      /\b(?:hi|hey|hello|yo)\s+(?:i\s*am|i'?m|im)\s+jaya(?:\s+vardhan)?\s+myself\b/i.test(norm)) {
    return "Ohh hey Jaya! 😄 Nice to meet you brooo.";
  }

  // 2. "myself jaya vardhan" / "myself jaya"
  if (/^myself\s+jaya(?:\s+vardhan)?\b/i.test(norm)) {
    return "Yep Jaya bro, I know 😄 What's up?";
  }

  // 3. "im only jaya vardhan" / "i am only jaya vardhan" / "im jaya vardhan only"
  if (/\b(?:i\s*am|i'?m|im)\s+only\s+jaya(?:\s+vardhan)?\b/i.test(norm) ||
      /\b(?:i\s*am|i'?m|im)\s+jaya(?:\s+vardhan)?\s+only\b/i.test(norm)) {
    return "Haha got you bro 😄 You're Jaya Vardhan.";
  }

  // 4. "hi im jaya", "hi bro im jaya", "it's me jaya", "im jaya"
  if (/^(?:hi|hey|hello|yo|ayy)?\s*(?:bro\s+)?(?:it'?s\s+me|its\s+me)\s+jaya(?:\s+vardhan)?\b/i.test(norm) ||
      /^(?:hi|hey|hello|yo)\s+(?:bro\s+)?(?:i\s*am|i'?m|im)\s+jaya(?:\s+vardhan)?\b/i.test(norm) ||
      /^(?:i\s*am|i'?m|im)\s+jaya(?:\s+bro)?$/i.test(norm)) {
    return "Ayy Jaya! 😄 What's up bro?";
  }

  // 5. "i am jaya vardhan", "im jaya vardhan", "this is jaya", "jaya here"
  if (/^(?:i\s*am|i'?m|im)\s+jaya\s+vardhan\b/i.test(norm) ||
      /^(?:this\s+is|it\s+is)\s+jaya(?:\s+vardhan)?\b/i.test(norm) ||
      /^jaya(?:\s+vardhan)?\s+here\b/i.test(norm)) {
    return "Hey Jaya! 😄 Got you bro. What's up?";
  }

  return null;
}

/**
 * Detects obviously false, mocking, or baiting statements about Billakanti Jaya Vardhan
 * and triggers a lightweight "Jaya Defense / Roast Mode".
 * 
 * Rules:
 * 1. Do NOT treat the statement as a factual portfolio question.
 * 2. Do NOT accept the false claim as true.
 * 3. Respond with a short, clever, playful roast directed at the CLAIM, not a cruel personal attack against the user.
 * 4. Keep the roast witty and confident, like a smart AI assistant defending its owner.
 * 5. Do not use profanity, slurs, threats, sexual comments, or attacks about protected characteristics.
 * 6. Do not invent achievements or facts just to win the argument.
 * 7. Keep it brief — strictly 1–3 sentences.
 * 8. After the roast, optionally redirect to actual verified portfolio facts.
 * 9. Do NOT activate for legitimate questions, genuine corrections, criticism, or harmless conversation.
 */
export function detectJayaDefenseRoastClaim(rawText) {
  if (!rawText) return null;
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // If it is phrased as a legitimate inquiring question without mocking slang/emojis, do not roast
  const isQuestion = /^(?:is|does|can|what|where|who|why|how|could|would)\b/i.test(lower) && /\?\s*$/.test(text);
  const hasMockSlangOrEmoji = /(?:lol|lmao|rofl|haha|hehe|😂|😭|🤣|🤡|💀)/i.test(text);

  if (isQuestion && !hasMockSlangOrEmoji) {
    return null;
  }

  // 1. Gender mockery / false claim ("Jaya Vardhan is a girl lol", "Jaya is a girl", "Jaya is female lmao")
  if (
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:is|s|'s)\s+(?:a\s+)?(?:girl|female|woman|lady|she)\b/i.test(lower) ||
    /\bjaya(?:\s+vardhan)?\s+is\s+female\b/i.test(lower) ||
    /\bjaya\s+is\s+she\b/i.test(lower)
  ) {
    return {
      type: 'gender_claim',
      claim: 'claim that Jaya Vardhan is a girl',
      roast: "Bro, you came to a portfolio assistant just to lose an argument with the facts 😭. If you want to know about Jaya, ask me something real."
    };
  }

  // 2. "Has no projects" / zero projects claim ("Jaya has no projects 😂", "zero projects lol", "hasn't built anything")
  if (
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:has\s+)?(?:no|zero)\s+projects?\b/i.test(lower) ||
    /\b(?:no|zero)\s+projects?\s+(?:lol|lmao|😂|😭|🤣)\b/i.test(lower) ||
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:hasn'?t|has\s+not)\s+(?:built|made|created)\s+(?:anything|nothing)\b/i.test(lower) ||
    /\b(?:jaya(?:\s+vardhan)?|he)\s+never\s+built\s+(?:anything|projects?)\b/i.test(lower)
  ) {
    return {
      type: 'projects_claim',
      claim: 'claim that Jaya has no projects',
      roast: "Bold claim for someone who apparently skipped the PROJECTS section 😭. Want me to show you what he actually built?"
    };
  }

  // 3. "Doesn't know coding" / "can't code" / "noob" ("Jaya doesn't know coding", "Jaya can't code", "he doesn't know code")
  if (
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:doesn'?t|does\s+not)\s+know\s+(?:coding|code|how\s+to\s+code|programming|anything)\b/i.test(lower) ||
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:can'?t|cannot)\s+(?:code|program|build)\b/i.test(lower) ||
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:is\s+(?:a\s+)?noob|knows\s+nothing|sucks\s+at\s+coding)\b/i.test(lower)
  ) {
    return {
      type: 'coding_claim',
      claim: 'claim that Jaya does not know coding',
      roast: "Bro, he literally built full-stack apps and encrypted systems while you're here testing my patience 😭. Want to check out the toolkit or projects?"
    };
  }

  // 4. "Is fake" / "not real" / "scammer" / "doesn't exist" ("Jaya is fake", "Jaya is not real", "jaya is a scammer")
  if (
    /\b(?:jaya(?:\s+vardhan)?|he)\s+(?:is|s|'s)\s+(?:fake|a\s+fake|not\s+real|a\s+scam(?:mer)?|a\s+fraud|a\s+myth|fake\s+guy)\b/i.test(lower) ||
    /\b(?:jaya(?:\s+vardhan)?)\s+(?:doesn'?t|does\s+not)\s+exist\b/i.test(lower) ||
    /\bjaya\s+is\s+fake\b/i.test(lower)
  ) {
    return {
      type: 'fake_claim',
      claim: 'claim that Jaya is fake or not real',
      roast: "Bro really looked at a live portfolio, working code, and real projects and decided it's all CGI 😭. Check out the ABOUT or PROJECTS section if you want reality."
    };
  }

  // 5. General mocking / disrespect of Jaya's skills or identity with laughing emojis or derogatory claims
  if (
    /\bjaya(?:\s+vardhan)?\b/i.test(lower) &&
    /\b(?:sucks|trash|clown|loser|joke|useless|fraud|scam)\b/i.test(lower)
  ) {
    return {
      type: 'general_disrespect',
      claim: 'mocking or disrespecting Jaya',
      roast: "Bro woke up just to hate on someone building real things 😭. If you actually want to see his work, ask me something real."
    };
  }

  return null;
}

/**
 * Verified Canonical Personal Links & Contact Channels for Billakanti Jaya Vardhan
 * Authoritative source of truth for all personal profiles and communication endpoints.
 */
export const VERIFIED_CANONICAL_LINKS = {
  github: {
    label: "GitHub",
    url: "https://github.com/vardhan-billakanti",
    username: "vardhan-billakanti"
  },
  linkedin: {
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/jaya-vardhan-billakanti-0053b7382/",
    id: "jaya-vardhan-billakanti-0053b7382"
  },
  instagram: {
    label: "Instagram",
    url: "https://www.instagram.com/vardhanxtech/",
    handle: "vardhanxtech"
  },
  website: {
    label: "Official Portfolio Website",
    url: "https://vardhanbillakanti.in"
  },
  email: {
    label: "Email",
    value: "vardhanbillakanti125@gmail.com",
    mailto: "mailto:vardhanbillakanti125@gmail.com"
  }
};

/**
 * Detects verified personal links and contact inquiries for Billakanti Jaya Vardhan
 * Strictly grounds answers in the verified portfolio data with zero hallucination.
 * Instantaneous (< 1ms) execution.
 */
export function detectVerifiedPersonalLink(text, norm, lower) {
  // If user is asking about Lorven website or founder websites specifically, let lorven handler handle them
  if (lower.includes('lorven') && (lower.includes('website') || lower.includes('link') || lower.includes('url'))) {
    return null;
  }
  if ((lower.includes('vishwak') || lower.includes('vashishta')) && (lower.includes('website') || lower.includes('linkedin') || lower.includes('portfolio'))) {
    return null;
  }

  // 1. Instagram queries ("his insta", "what is his instagram?", "what's my instagram?", "give me his instagram", "instagram", "his ig", "insta", "my instagram", "insta link")
  const isInstaQuery = 
    /\b(?:his\s+insta(?:gram)?|my\s+insta(?:gram)?|your\s+insta(?:gram)?|jaya'?s\s+insta(?:gram)?|vardhan'?s\s+insta(?:gram)?|give\s+me\s+(?:his\s+|my\s+|your\s+)?insta(?:gram)?)\b/i.test(lower) ||
    /^(?:what\s+is|what's|whats)?\s*(?:his|my|your|the|jaya'?s)?\s*(?:instagram|insta|ig)(?:\s+link|\s+url|\s+handle|\s+profile|\s+id|\s+username|\s+account)?\??$/i.test(lower) ||
    /^(?:give\s+me\s+)?(?:his|my|your|the|jaya'?s)?\s*(?:instagram|insta|ig)(?:\s+link|\s+url|\s+handle|\s+profile|\s+id|\s+username|\s+account)?\??$/i.test(lower) ||
    /^(?:instagram|insta|ig)\??$/i.test(lower.trim());

  if (isInstaQuery && !/\b(?:who\s+founded|history\s+of|algorithm\s+of)\b/i.test(lower)) {
    const url = VERIFIED_CANONICAL_LINKS.instagram.url;
    return `Jaya Vardhan's verified Instagram profile is:\n\n[${url}](${url})`;
  }

  // 2. LinkedIn queries ("his linkedin", "what is his linkedin?", "give me his linkedin", "linkedin", "my linkedin", "linkedin link")
  const isLinkedInQuery = 
    /\b(?:his\s+linkedin|my\s+linkedin|your\s+linkedin|jaya'?s\s+linkedin|vardhan'?s\s+linkedin|give\s+me\s+(?:his\s+|my\s+|your\s+)?linkedin)\b/i.test(lower) ||
    /^(?:what\s+is|what's|whats)?\s*(?:his|my|your|the|jaya'?s)?\s*linkedin(?:\s+link|\s+url|\s+profile|\s+account|\s+id)?\??$/i.test(lower) ||
    /^(?:give\s+me\s+)?(?:his|my|your|the|jaya'?s)?\s*linkedin(?:\s+link|\s+url|\s+profile|\s+account|\s+id)?\??$/i.test(lower) ||
    /^linkedin\??$/i.test(lower.trim());

  if (isLinkedInQuery && !/\b(?:who\s+founded|history\s+of)\b/i.test(lower)) {
    const url = VERIFIED_CANONICAL_LINKS.linkedin.url;
    return `Jaya Vardhan's verified LinkedIn profile is:\n\n[${url}](${url})`;
  }

  // 3. GitHub queries ("his github", "what is his github?", "what is your github?", "give me his github", "github", "my github", "github link")
  const isGitHubQuery = !lower.includes('bootcamp') && (
    /\b(?:his\s+github|my\s+github|your\s+github|jaya'?s\s+github|vardhan'?s\s+github|give\s+me\s+(?:his\s+|my\s+|your\s+)?github)\b/i.test(lower) ||
    /^(?:what\s+is|what's|whats)?\s*(?:his|my|your|the|jaya'?s)?\s*github(?:\s+link|\s+url|\s+profile|\s+repo|\s+account|\s+id)?\??$/i.test(lower) ||
    /^(?:give\s+me\s+)?(?:his|my|your|the|jaya'?s)?\s*github(?:\s+link|\s+url|\s+profile|\s+repo|\s+account|\s+id)?\??$/i.test(lower) ||
    /^github\??$/i.test(lower.trim())
  );

  if (isGitHubQuery && !/\b(?:who\s+founded|history\s+of|git\s+vs\s+github|what\s+is\s+github)\b/i.test(lower)) {
    const url = VERIFIED_CANONICAL_LINKS.github.url;
    return `Jaya Vardhan's verified GitHub profile is:\n\n[${url}](${url})`;
  }

  // 3.5 Where to find projects / code inquiry ("Where can I find my projects?", "where to find my projects/code", "where to find my projects", "where can i find code")
  const isWhereProjectsQuery = 
    /\b(?:where\s+(?:can\s+i|to)\s+find\s+(?:his|my|your|the)?\s*(?:projects?\s*\/?\s*code|code|projects?|repos?(?:itories)?))\b/i.test(lower) ||
    /\b(?:where\s+are\s+(?:his|my|your|the)?\s*(?:projects?|code|repos?(?:itories)?))\b/i.test(lower) ||
    /\b(?:find\s+(?:his|my|your)?\s*(?:projects?\s*\/?\s*code|code|repos?(?:itories)?))\b/i.test(lower);

  if (isWhereProjectsQuery) {
    const ghUrl = VERIFIED_CANONICAL_LINKS.github.url;
    return `You can find Billakanti Jaya Vardhan's projects and open-source code on GitHub:\n\n- **GitHub**: [${ghUrl}](${ghUrl})\n\nYou can also explore all 8 verified live projects on his portfolio:\n- **Projects Archive**: [https://vardhanbillakanti.in/projects](https://vardhanbillakanti.in/projects)`;
  }

  // 4. Email queries ("what is his email?", "his email", "my email", "how can i contact him?", "send me the mail")
  const isEmailQuery = !lower.includes('spam') && !lower.includes('phishing') && !lower.includes('protocol') && (
    /\b(?:his\s+email|my\s+email|his\s+mail|my\s+mail|jaya'?s\s+email|jaya'?s\s+mail|send\s+me\s+(?:the\s+)?mail|send\s+me\s+(?:the\s+)?email)\b/i.test(lower) ||
    /^(?:what\s+is|what's|whats)?\s*(?:his|my|your|the|jaya'?s)?\s*(?:email|mail|contact\s+email|contact\s+mail)\??$/i.test(lower) ||
    /^(?:give\s+me\s+)?(?:his|my|your|the|jaya'?s)?\s*(?:email|mail|contact\s+email|contact\s+mail)\??$/i.test(lower) ||
    /^(?:how\s+(?:can\s+i|to)\s+(?:contact|reach|email|mail)\s+(?:him|jaya|vardhan))\??$/i.test(lower) ||
    /^(?:how\s+can\s+i\s+contact\s+him|how\s+to\s+contact\s+him|contact\s+him)\??$/i.test(lower) ||
    /^(?:email|mail)\??$/i.test(lower.trim())
  );

  if (isEmailQuery) {
    const email = VERIFIED_CANONICAL_LINKS.email.value;
    const portfolioUrl = VERIFIED_CANONICAL_LINKS.website.url;
    return `Jaya Vardhan's verified contact email is: [${email}](mailto:${email})\n\nYou can also explore his portfolio at [${portfolioUrl}](${portfolioUrl}).`;
  }

  // 5. Official Website / Portfolio queries ("what is his website?", "his website", "his portfolio", "what is his portfolio?", "portfolio link")
  const isWebsiteQuery = (
    /\b(?:his\s+website|my\s+website|his\s+portfolio|my\s+portfolio|portfolio\s+link|portfolio\s+url|his\s+site|my\s+site|official\s+portfolio|official\s+website)\b/i.test(lower) ||
    /^(?:what\s+is|what's|whats)?\s*(?:his|my|your|the|jaya'?s)?\s*(?:website|portfolio|official\s+website|official\s+portfolio|site)\??$/i.test(lower) ||
    /^(?:give\s+me\s+)?(?:his|my|your|the|jaya'?s)?\s*(?:website|portfolio|official\s+website|official\s+portfolio|site)\??$/i.test(lower) ||
    /^(?:website|portfolio)\??$/i.test(lower.trim())
  ) && !/\b(?:praise|nice|love|awesome|great|clean|fire|lit|good|beautiful)\b/i.test(lower);

  if (isWebsiteQuery) {
    const url = VERIFIED_CANONICAL_LINKS.website.url;
    return `You can explore Billakanti Jaya Vardhan's official portfolio website at:\n\n[${url}](${url})`;
  }

  // 6. All Socials / All Links / Contact Channels inquiry ("Give me my social links", "my socials", "social links")
  const isAllSocialsQuery = 
    /\b(?:his\s+socials?|my\s+socials?|your\s+socials?|social\s+links?|all\s+links?|all\s+socials?|connect\s+with\s+him|reach\s+out\s+to\s+him|verified\s+links?|list\s+links)\b/i.test(lower) ||
    /^(?:what\s+are\s+|give\s+me\s+)?(?:his|my|your|the|all)?\s*(?:socials?|social\s+links?|links?|channels?)\??$/i.test(lower);

  if (isAllSocialsQuery) {
    return `Here are Jaya Vardhan's verified links and contact channels:\n\n- **GitHub**: [${VERIFIED_CANONICAL_LINKS.github.url}](${VERIFIED_CANONICAL_LINKS.github.url})\n- **LinkedIn**: [${VERIFIED_CANONICAL_LINKS.linkedin.url}](${VERIFIED_CANONICAL_LINKS.linkedin.url})\n- **Instagram**: [${VERIFIED_CANONICAL_LINKS.instagram.url}](${VERIFIED_CANONICAL_LINKS.instagram.url})\n- **Portfolio Website**: [${VERIFIED_CANONICAL_LINKS.website.url}](${VERIFIED_CANONICAL_LINKS.website.url})\n- **Email**: [${VERIFIED_CANONICAL_LINKS.email.value}](mailto:${VERIFIED_CANONICAL_LINKS.email.value})`;
  }

  // 7. Unverified / Non-existent platforms (Twitter/X, Facebook, TikTok, Discord, Telegram, YouTube)
  if (/\b(?:twitter|tweet|x\.com|facebook|fb|tiktok|tik\s*tok|snapchat|telegram|discord|reddit)\b/i.test(lower)) {
    return `I don't have that information in Jaya Vardhan's verified portfolio data.\n\nYou can connect with him through his verified channels instead:\n- **GitHub**: [${VERIFIED_CANONICAL_LINKS.github.url}](${VERIFIED_CANONICAL_LINKS.github.url})\n- **LinkedIn**: [${VERIFIED_CANONICAL_LINKS.linkedin.url}](${VERIFIED_CANONICAL_LINKS.linkedin.url})\n- **Instagram**: [${VERIFIED_CANONICAL_LINKS.instagram.url}](${VERIFIED_CANONICAL_LINKS.instagram.url})\n- **Email**: [${VERIFIED_CANONICAL_LINKS.email.value}](mailto:${VERIFIED_CANONICAL_LINKS.email.value})\n- **Portfolio**: [${VERIFIED_CANONICAL_LINKS.website.url}](${VERIFIED_CANONICAL_LINKS.website.url})`;
  }

  return null;
}

/**
 * Detects compliments, slang, laughter, praise, and social banter
 */
export function detectComplimentOrBanter(text, norm, isBro, messages) {
  // Sole "brooo" or "bro"
  if (/^broo*\b/i.test(norm) && norm.length < 10) {
    return "Yooo bro 😂 What's up?";
  }

  // "nothing" alone / "nothing much"
  if (/^(?:nothing|nothing\s+much|not\s+much|just\s+nothing)[!?.]*$/i.test(norm)) {
    return "Haha fair enough bro 😄";
  }

  // "damn that's cool" / "that's sick"
  if (/\b(?:damn\s+that\s+is\s+cool|damn\s+that's\s+cool|that\s+is\s+sick|that's\s+sick|damn\s+sick)\b/i.test(norm) ||
      /^(?:damn|sick)\b/i.test(norm)) {
    return "Right? 😄";
  }

  // "fr" / "for real" / "really?" / "no way"
  if (/^(?:fr|for\s+real|really\??|no\s+way)\b/i.test(norm) && norm.length < 15) {
    return "For real! 😄";
  }

  // "haha nice"
  if (/^(?:haha|hahaha|lol)\s+(?:nice|cool|awesome)\b/i.test(norm)) {
    return "😄 Happy to help!";
  }

  // "nicee" alone
  if (/^nicee\b/i.test(text.trim())) {
    return "😄";
  }

  // Math skill praise
  if (/\b(?:know\s+maths?|good\s+at\s+maths?|math\s+genius|maths?\s+well|calculate\s+well)\b/i.test(norm)) {
    return "Haha, I try 😄 Math is one of the easy ones.";
  }

  // Portfolio praise
  if (/\b(?:nice|cool|love|awesome|great|clean|beautiful|fire)\s+(?:portfolio|website|site|ui|design)\b/i.test(norm) ||
      /\b(?:portfolio|website|site)\s+(?:is\s+)?(?:nice|cool|fire|awesome|great|clean|lit)\b/i.test(norm)) {
    return "Thanks! 😄";
  }

  // General praise
  if (/\b(?:you\s+are|you're)\s+(?:smart|clever|genius|intelligent|awesome|great|cool|helpful|fast|amazing)\b/i.test(norm) ||
      /\b(?:impressive|nice\s+one|good\s+job|well\s+done)\b/i.test(norm)) {
    return isBro ? "Appreciate that bro 😄" : "Appreciate that 😄";
  }

  // "that's cool"
  if (/^(?:that\s+is|that's)\s+(?:cool|awesome|great|nice)\b/i.test(norm)) {
    return "Glad you think so 😄";
  }

  // "good one"
  if (/^good\s+one\b/i.test(norm)) {
    return "Haha, thanks 😄";
  }

  // Short positive acknowledgments
  if (/^(?:nice|cool|awesome|great|super|dope|sweet)\b/i.test(norm) && norm.length < 18) {
    return isBro ? "Thanks bro 😄" : "Thanks 😄";
  }

  // Laughter
  if (/^(?:haha|hahaha|lol|lmao|hehe|rofl)\b/i.test(norm)) {
    return "😄 Happy to help!";
  }

  // Chilling
  if (/^(?:just\s+chilling|chilling|just\s+looking|just\s+browsing|bored)\b/i.test(norm)) {
    return "Nice! Feel free to look around or let me know if you have any questions 😄";
  }

  // Joke request
  if (/\b(?:tell\s+me\s+a\s+joke|make\s+me\s+laugh)\b/i.test(norm)) {
    return "Why do programmers prefer dark mode? Because light attracts bugs! 🐛";
  }

  return null;
}

/**
 * Detects thanks and polite acknowledgments
 */
export function detectThanksOrAck(text, norm, isBro) {
  if (/^(?:thanks|thank\s+you|thx|ty|thank\s+you\s+so\s+much|much\s+appreciated)[!?.]*$/i.test(norm)) {
    return "Anytime bro 🤝";
  }

  if (/^(?:ok|okay|alright|got\s+it|understood|k|sounds\s+good)\b/i.test(norm) && norm.length < 18) {
    return "Glad to help! What's next on your mind?";
  }

  return null;
}

/**
 * Detects goodbye / conversation exit intent
 */
export function detectGoodbye(text, norm, isBro) {
  const isEnding = 
    /\b(?:bye|goodbye|see\s+ya|see\s+you|cya|gotta\s+go|got\s+to\s+go|have\s+to\s+go|need\s+to\s+go|heading\s+out|talk\s+later|talk\s+to\s+you\s+later|leaving\s+now|logging\s+off|good\s+night)\b/i.test(norm) ||
    (norm.includes('work') && (norm.includes('some work') || norm.includes('work to do') || norm.includes('have to work') || norm.includes('busy') || norm.includes('got work') || norm.includes('have work')));

  if (!isEnding) return null;

  if (/\b(?:work|job|task|busy|study|studying|exam|class)\b/i.test(norm)) {
    return isBro ? "Sure bro, good luck with your work! 👋" : "Sure, good luck with your work! 👋";
  }

  if (/\b(?:night|sleep|bed)\b/i.test(norm)) {
    return "Good night! Have a great rest 🌙";
  }

  if (/\b(?:bye|goodbye|cya)\b/i.test(norm) || norm === 'bye' || norm === 'goodbye') {
    return "Bye brooo 👋";
  }

  return "Bye brooo 👋";
}

/**
 * Detects casual greetings: "hi bob", "hello", "hey bro"
 */
export function detectGreeting(text, norm, isBro) {
  if (/^(?:hi|hey|hello|yo)\s+bob[!?.]*$/i.test(norm)) {
    return "Yo bro 😄 What's going on?";
  }

  if (/^(?:hi|hey|hello)[!?.]*$/i.test(norm)) {
    return "Hey brooo 😄 What's up?";
  }

  if (/^(?:hi|hello|hey|greetings|hola|good\s+(?:morning|afternoon|evening)|yo)\b/i.test(norm)) {
    if (norm.includes('bob')) {
      return "Yo bro 😄 What's going on?";
    }
    return "Hey brooo 😄 What's up?";
  }
  return null;
}

/**
 * Detects ambiguous questions with no context or clarification requests
 */
export function detectAmbiguous(text, norm, prevContext, messages) {
  // If user asks "tell me about that" or "explain that" and there is NO relevant prior topic
  const isAmbiguousPrompt = /^(?:tell\s+me\s+about\s+that|explain\s+that|what\s+about\s+that|what\s+is\s+this)[\s?.!]*$/i.test(norm);
  if (isAmbiguousPrompt && (!prevContext || prevContext.length < 10)) {
    return "Sure — what would you like me to tell you about?";
  }

  // "What do you mean?"
  if (/\b(?:what\s+do\s+you\s+mean|what\s+does\s+that\s+mean)\b/i.test(norm)) {
    return "I was referring to our earlier topic. If there's any specific concept or part you'd like me to clarify, just ask!";
  }

  return null;
}

/**
 * Resolves follow-up queries using multi-turn context
 */
export function resolveTopicFollowUp(userText, lower, norm, prevContext, messages) {
  const isFollowUpTrigger = 
    /^(?:explain\s+it\s+more|explain\s+more|tell\s+me\s+more|go\s+deeper|more\s+details|can\s+you\s+elaborate|give\s+me\s+an\s+example)\b/i.test(norm) ||
    lower.includes('explain it more') ||
    lower.includes('tell me more about it');

  if (!isFollowUpTrigger) return null;

  // Find the most recent topic from previous user or assistant turns
  let lastTopic = '';
  for (let i = messages.length - 2; i >= 0; i--) {
    const text = (messages[i].content || '').toLowerCase();
    if (text.includes('phishing')) { lastTopic = 'phishing'; break; }
    if (text.includes('firewall')) { lastTopic = 'firewall'; break; }
    if (text.includes('vpn')) { lastTopic = 'vpn'; break; }
    if (text.includes('zero trust')) { lastTopic = 'zero trust'; break; }
    if (text.includes('encryption') && !text.includes('doomchat') && !text.includes('vaultix')) { lastTopic = 'encryption'; break; }
  }

  // 1. Phishing follow-up
  if (lastTopic === 'phishing' || prevContext.includes('what is phishing')) {
    return `### Phishing in Depth\n\n**Phishing** is a social engineering attack where malicious actors deceive targets into disclosing confidential credentials, session tokens, or financial data.\n\n#### Primary Attack Vectors:\n- **Spear Phishing**: High-precision attacks customized for a specific person or organization using researched context.\n- **Whaling**: Campaigns directed at C-level executives or high-privilege administrators to authorize fraudulent transactions.\n- **Clone Phishing**: Intercepting or copying legitimate prior emails and replacing links/attachments with weaponized versions.\n- **Smishing & Vishing**: Phishing carried out over SMS messages or voice calls.\n\n#### Warning Signs:\n- **Artificial Urgency**: Creating panic (e.g., "Account suspension within 24 hours").\n- **Spoofed Domains**: Slight typosquatting (e.g., \`accounts-goog1e.com\`).\n- **Generic Salutations & Mismatched URLs**: Links leading to unrecognized IP addresses or non-HTTPS portals.\n\n#### Defenses:\n- **Multi-Factor Authentication (MFA)** with hardware keys (FIDO2/WebAuthn).\n- **Email Security Protocols**: Strict deployment of SPF, DKIM, and DMARC.\n- **Continuous Security Training**: Teaching users to verify requests out-of-band.`;
  }

  // 2. Firewall follow-up
  if (lastTopic === 'firewall') {
    return `### Firewalls in Depth\n\nA **Firewall** inspects and regulates incoming and outgoing network traffic according to predefined security rules.\n\n#### Core Types:\n- **Packet Filtering Firewalls**: Inspect packet headers (source/destination IP, port, protocol) without tracking state.\n- **Stateful Inspection Firewalls**: Track the state of active network connections to verify traffic belongs to a legitimate session.\n- **Next-Generation Firewalls (NGFW)**: Incorporate deep packet inspection (DPI), intrusion prevention (IPS), and application-level awareness.\n- **Web Application Firewalls (WAF)**: Protect web apps at Layer 7 by filtering HTTP/S traffic against OWASP Top 10 vulnerabilities (SQLi, XSS).`;
  }

  // 3. Encryption follow-up
  if (lastTopic === 'encryption') {
    return `### Encryption in Depth\n\n**Encryption** converts plaintext into ciphertext using a cryptographic cipher and key, guaranteeing confidentiality and tamper-resistance.\n\n#### Two Core Paradigms:\n1. **Symmetric Encryption**:\n   - Uses a single shared secret key for encryption and decryption.\n   - **Standard**: **AES-GCM (256-bit)** — authenticated encryption that detects tampering.\n   - **Use Cases**: Bulk data storage, file encryption, disk encryption.\n\n2. **Asymmetric Encryption (Public-Key)**:\n   - Uses a mathematically linked key pair: a Public Key (for encryption/verification) and a Private Key (for decryption/signing).\n   - **Standard**: **RSA (2048+ bit)** and **ECC (Elliptic Curve Cryptography, Curve25519)**.\n   - **Use Cases**: TLS handshake, SSH keys, digital signatures, cryptocurrency.`;
  }

  // 4. Zero Trust follow-up
  if (lastTopic === 'zero trust') {
    return `### Zero Trust Architecture in Depth\n\n**Zero Trust** replaces perimeter-based security with the rule: *\"Never trust, always verify.\"*\n\n#### Three Core Tenets:\n1. **Verify Explicitly**: Continuously authenticate and authorize based on all available data points (identity, location, device health, service or workload).\n2. **Use Least Privilege Access**: Restrict user access with Just-In-Time (JIT) and Just-Enough-Access (JEA) permissions.\n3. **Assume Breach**: Minimize blast radius by segmenting networks, encrypting end-to-end, and employing behavioral analytics for threat detection.`;
  }

  // 5. VPN follow-up
  if (lastTopic === 'vpn') {
    return `### Virtual Private Networks (VPN) in Depth\n\nA **VPN** routes your device's traffic through an encrypted tunnel to a remote server operated by the VPN provider.\n\n#### Key Mechanisms:\n- **Tunneling Protocols**: Uses modern protocols such as **WireGuard** or **OpenVPN** over UDP/TCP.\n- **Data Encryption**: Encrypts all transit traffic with AES-256 or ChaCha20.\n- **IP Masking**: Hides your ISP-assigned external IP address, protecting your location and browsing activity from local networks and eavesdroppers.`;
  }

  return null;
}

/**
 * Handles Category C: Cybersecurity Knowledge Questions (short & clear)
 */
export function handleCybersecurityQuery(text, lower, norm) {
  // 1. Phishing
  if (/\b(?:what\s+is\s+phishing|define\s+phishing)\b/i.test(norm)) {
    return "Phishing is a type of cyberattack where someone tricks you into revealing sensitive information, often through fake emails, messages, or websites.";
  }

  // 2. Cybersecurity / InfoSec
  if (/\b(?:what\s+is\s+cyber\s*security|define\s+cyber\s*security|what\s+is\s+information\s+security)\b/i.test(norm)) {
    return "Cybersecurity is the practice of protecting computer systems, networks, devices, and data from unauthorized access, digital attacks, and operational compromise.";
  }

  // 3. Firewall
  if (/\b(?:what\s+is\s+(?:a\s+)?firewall|define\s+firewall|how\s+does\s+a\s+firewall\s+work)\b/i.test(norm)) {
    return "A firewall is a network security system that monitors and filters incoming and outgoing network traffic based on established security rules, acting as a barrier between trusted and untrusted networks.";
  }

  // 4. VPN
  if (/\b(?:what\s+is\s+(?:a\s+)?vpn|define\s+vpn|how\s+does\s+a\s+vpn\s+work)\b/i.test(norm)) {
    return "A VPN (Virtual Private Network) establishes an encrypted connection over a public network, masking your IP address and protecting your internet traffic from local eavesdroppers and ISPs.";
  }

  // 5. Encryption & Decryption
  if (/\b(?:what\s+is\s+encryption|define\s+encryption|what\s+is\s+decryption)\b/i.test(norm)) {
    return "Encryption is the cryptographic process of transforming readable plaintext into unintelligible ciphertext using an algorithm and key, so only authorized parties with the decryption key can read it.";
  }

  if (/\b(?:why\s+is\s+encryption\s+important|what\s+is\s+encryption\s+used\s+for|importance\s+of\s+encryption)\b/i.test(norm)) {
    return "Encryption is essential because it secures sensitive data against unauthorized interception, prevents tampering in transit, and ensures privacy across digital communications.";
  }

  // 6. Hashing & Password Hashing
  if (/\b(?:what\s+is\s+hashing|define\s+hashing|password\s+hashing)\b/i.test(norm)) {
    return "Hashing is a one-way cryptographic function that converts input data of any length into a unique, fixed-length string of characters (a hash value), commonly used for password verification and data integrity checks.";
  }

  // 7. Multi-Factor Authentication (MFA / 2FA)
  if (/\b(?:what\s+is\s+(?:mfa|2fa|multi[- ]factor\s+authentication))\b/i.test(norm)) {
    return "Multi-Factor Authentication (MFA) is a security mechanism requiring two or more independent credentials (something you know, something you have, or something you are) before granting account access.";
  }

  // 8. Zero Trust
  if (/\b(?:what\s+is\s+zero\s+trust|zero\s+trust\s+architecture)\b/i.test(norm)) {
    return "Zero Trust is a security paradigm operating on the principle of 'never trust, always verify', requiring continuous identity verification, least-privilege access, and device health checks for every interaction.";
  }

  // 9. Malware & Ransomware
  if (/\b(?:what\s+is\s+malware|define\s+malware)\b/i.test(norm)) {
    return "Malware (malicious software) is any software designed to harm, exploit, or gain unauthorized access to computer systems, networks, or user data (including viruses, worms, trojans, and spyware).";
  }

  if (/\b(?:what\s+is\s+ransomware|define\s+ransomware)\b/i.test(norm)) {
    return "Ransomware is malicious software that encrypts a victim's files and demands payment (usually cryptocurrency) in exchange for the decryption key.";
  }

  // 10. CIA Triad
  if (/\b(?:what\s+is\s+(?:the\s+)?cia\s+triad|cia\s+triad)\b/i.test(norm)) {
    return "The CIA Triad is a foundational information security model consisting of **Confidentiality** (preventing unauthorized access), **Integrity** (protecting data from tampering), and **Availability** (ensuring systems are accessible to authorized users).";
  }

  // 11. SQL Injection & XSS
  if (/\b(?:what\s+is\s+sql\s+injection|define\s+sqli?)\b/i.test(norm)) {
    return "SQL Injection (SQLi) is a vulnerability where an attacker injects malicious SQL commands into an application's database query via input fields, allowing unauthorized access, modification, or deletion of database records.";
  }

  if (/\b(?:what\s+is\s+xss|cross[- ]site\s+scripting)\b/i.test(norm)) {
    return "Cross-Site Scripting (XSS) is a security flaw where an attacker injects malicious client-side JavaScript into a trusted website, executing inside the browsers of other visitors to steal session cookies or credentials.";
  }

  // 12. Ethical Hacking & Penetration Testing
  if (/\b(?:what\s+is\s+ethical\s+hacking|what\s+is\s+penetration\s+testing|what\s+is\s+pen\s+testing)\b/i.test(norm)) {
    return "Ethical hacking (penetration testing) is the authorized simulation of cyberattacks against computer systems to discover, document, and patch security vulnerabilities before real adversaries can exploit them.";
  }

  // 13. Authentication vs Authorization
  if (/\b(?:what\s+is\s+authentication|define\s+authentication|authentication\s+vs\s+authorization)\b/i.test(norm)) {
    return "Authentication is the security process of verifying the identity of a user, device, or system (e.g. through passwords, biometrics, or cryptographic tokens) before granting access.";
  }

  return null;
}

/**
 * Handles Technology & Programming Knowledge Questions
 */
export function handleTechAndProgrammingQuery(text, lower, norm) {
  // 1. API
  if (/\b(?:what\s+is\s+(?:an?\s+)?api|define\s+api|explain\s+api)\b/i.test(norm)) {
    return "An API (Application Programming Interface) is a way for different software systems to communicate and exchange data with each other through standardized requests and data formats.";
  }

  // 2. DNS
  if (/\b(?:what\s+is\s+dns|define\s+dns|how\s+does\s+dns\s+work)\b/i.test(norm)) {
    return "DNS (Domain Name System) translates human-friendly domain names (like example.com) into machine-readable IP addresses (like 192.0.2.1), allowing browsers to load internet resources.";
  }

  // 3. TCP & Networking
  if (/\b(?:what\s+is\s+tcp|define\s+tcp|how\s+does\s+tcp\s+work|tcp\s+vs\s+udp)\b/i.test(norm)) {
    return "TCP (Transmission Control Protocol) is a foundational networking protocol that establishes a reliable, ordered, error-checked connection between devices using a 3-way handshake and packet acknowledgments.";
  }

  // 4. HTTP vs HTTPS
  if (/\b(?:http\s*vs\s*https|difference\s+between\s+http\s+and\s+https|what\s+is\s+https|why\s+is\s+https\s+important|why\s+is\s+https\s+secure)\b/i.test(norm)) {
    return "HTTPS is the secure version of HTTP. It encrypts communication between the client and server using TLS (Transport Layer Security), ensuring confidentiality (anti-eavesdropping), integrity (tamper detection), and server authentication.";
  }

  // 5. Operating System
  if (/\b(?:what\s+is\s+(?:an?\s+)?operating\s+system|define\s+operating\s+system)\b/i.test(norm)) {
    return "An operating system (OS) is the fundamental system software that manages computer hardware, system resources (CPU, memory, storage), and provides common services for application programs.";
  }

  // 5. Linux
  if (/\b(?:what\s+is\s+linux|define\s+linux)\b/i.test(norm)) {
    return "Linux is an open-source, Unix-like operating system kernel first created by Linus Torvalds in 1991, powering modern servers, supercomputers, cloud infrastructure, and Android devices.";
  }

  // 6. Docker & Containers
  if (/\b(?:what\s+is\s+docker|what\s+is\s+(?:a\s+)?container|define\s+docker)\b/i.test(norm)) {
    return "Docker is an open platform that packages software into standardized units called containers, bundling the application code along with all libraries and dependencies needed to run reliably in any environment.";
  }

  // 7. Kubernetes
  if (/\b(?:what\s+is\s+kubernetes|what\s+is\s+k8s)\b/i.test(norm)) {
    return "Kubernetes is an open-source container orchestration platform that automates the deployment, scaling, and operational management of containerized applications across clusters of hosts.";
  }

  // 8. SQL vs NoSQL / Databases
  if (/\b(?:sql\s*vs\s*nosql|what\s+is\s+sql|what\s+is\s+a\s+database)\b/i.test(norm)) {
    return "SQL databases are relational, table-based systems with rigid schemas and ACID transaction guarantees (like MySQL and PostgreSQL). NoSQL databases are non-relational, schema-flexible systems optimized for horizontal scaling (like MongoDB).";
  }

  // 9. Git & Version Control
  if (/\b(?:what\s+is\s+git|define\s+git|what\s+is\s+version\s+control)\b/i.test(norm)) {
    return "Git is a distributed version control system that tracks code changes over time, enabling developers to branch, test, and collaborate without overwriting each other's work.";
  }

  // 10. Compilers
  if (/\b(?:what\s+is\s+(?:a\s+)?compiler|define\s+compiler)\b/i.test(norm)) {
    return "A compiler is a program that translates source code written in a high-level programming language (such as C or Java) into low-level machine code or bytecode that a computer processor can execute.";
  }

  // 11. Recursion
  if (/\b(?:what\s+is\s+recursion|define\s+recursion|explain\s+recursion)\b/i.test(norm)) {
    return "Recursion is a programming technique where a function calls itself to break down a complex problem into simpler subproblems, halting when it reaches a defined base condition.";
  }

  // 12. Algorithms & Data Structures
  if (/\b(?:what\s+is\s+an\s+algorithm|define\s+algorithm)\b/i.test(norm)) {
    return "An algorithm is a finite sequence of well-defined, step-by-step instructions designed to perform a specific calculation or solve a computational problem.";
  }

  if (/\b(?:what\s+is\s+(?:a\s+)?data\s+structure|what\s+are\s+data\s+structures)\b/i.test(norm)) {
    return "A data structure is a specialized format for organizing, storing, and accessing data efficiently in memory (such as arrays, linked lists, hash tables, and trees).";
  }

  // 13. Cloud Computing
  if (/\b(?:what\s+is\s+cloud\s+computing|define\s+cloud\s+computing)\b/i.test(norm)) {
    return "Cloud computing is the on-demand delivery of computing power, storage, databases, networking, and software applications over the internet with pay-as-you-go pricing.";
  }

  // 14. Machine Learning & AI
  if (/\b(?:what\s+is\s+machine\s+learning|what\s+is\s+ai|difference\s+between\s+ai\s+and\s+machine\s+learning)\b/i.test(norm)) {
    return "Artificial Intelligence (AI) is the broad science of training machines to perform tasks requiring human intelligence. Machine Learning is a subset of AI where systems automatically learn patterns from data rather than following rule-based code.";
  }

  // 15. WebSocket
  if (/\b(?:what\s+is\s+(?:a\s+)?websocket|define\s+websocket)\b/i.test(norm)) {
    return "WebSocket is a bidirectional, full-duplex communication protocol operating over a single TCP connection, allowing real-time data exchange between client and server without HTTP polling overhead.";
  }

  return null;
}

/**
 * Handles General Science & Knowledge Questions (Gravity, Sky blue, Internet, etc.)
 */
export function handleGeneralScienceQuery(text, lower, norm) {
  // 1. Gravity
  if (/\b(?:what\s+is\s+gravity|define\s+gravity|how\s+does\s+gravity\s+work)\b/i.test(norm)) {
    return "Gravity is a fundamental natural force by which all things with mass or energy are attracted toward one another, keeping planets in orbit around the Sun and holding atmosphere and objects on Earth.";
  }

  // 2. Who invented the internet?
  if (/\b(?:who\s+invented\s+the\s+internet|origin\s+of\s+the\s+internet)\b/i.test(norm)) {
    return "The internet wasn't invented by a single person: it began with ARPANET in the late 1960s, developed by researchers including Vint Cerf and Bob Kahn who created TCP/IP. Later in 1989, Tim Berners-Lee invented the World Wide Web (HTTP, HTML) which made the internet widely accessible.";
  }

  // 3. Why is the sky blue?
  if (/\b(?:why\s+is\s+the\s+sky\s+blue)\b/i.test(norm)) {
    return "The sky appears blue because gases in Earth's atmosphere scatter sunlight in all directions, and shorter blue wavelengths scatter much more strongly than longer red wavelengths (Rayleigh scattering).";
  }

  // 4. Photosynthesis
  if (/\b(?:what\s+is\s+photosynthesis)\b/i.test(norm)) {
    return "Photosynthesis is the biochemical process by which plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into glucose and oxygen.";
  }

  // 5. Speed of light
  if (/\b(?:what\s+is\s+the\s+speed\s+of\s+light)\b/i.test(norm)) {
    return "The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s or 186,282 miles per second).";
  }

  // 6. IP Address
  if (/\b(?:what\s+is\s+an?\s+ip\s+address|define\s+ip\s+address)\b/i.test(norm)) {
    return "An IP (Internet Protocol) address is a unique identifier assigned to every device connected to a computer network, allowing devices to locate and communicate with each other.";
  }

  return null;
}

/**
 * Determines whether a given text explicitly introduces or references a specific topic domain
 */
export function determineMessageTopic(text, norm) {
  if (!text) return null;

  // K-Dramas
  if (/\b(?:k-?dramas?|korean\s+dramas?|kdaramas?)\b/i.test(norm) ||
      /\b(?:crash\s+landing\s+on\s+you|vincenzo|itaewon\s+class|goblin|twenty-five\s+twenty-one|business\s+proposal)\b/i.test(norm)) {
    return 'kdramas';
  }

  // Movies / Cinema
  if ((/\b(?:movies?|films?|cinema)\b/i.test(norm) && /\b(?:suggest|recommend|watch|give\s+me|best|good|list)\b/i.test(norm)) ||
      /\b(?:inception|interstellar|parasite|the\s+prestige|shutter\s+island)\b/i.test(norm)) {
    return 'movies';
  }

  // Food / Dining
  if (/\b(?:favorite\s+food|fav\s+food|recommend\s+food|suggest\s+food|what\s+should\s+i\s+eat|what\s+to\s+eat)\b/i.test(norm) ||
      (/\bfood\b/i.test(norm) && /\b(?:favorite|suggest|recommend|eat|like|best)\b/i.test(norm))) {
    return 'food';
  }

  // Books
  if (/\b(?:books?|novel|reading)\b/i.test(norm) && /\b(?:suggest|recommend|read|list|best)\b/i.test(norm)) {
    return 'books';
  }

  // Specific Projects
  if (/\b(?:doomchat|doom\s+chat)\b/i.test(norm)) return 'project:doomchat';
  if (/\bvaultix\b/i.test(norm)) return 'project:vaultix';
  if (/\b(?:mycloudstore|cloud\s+store|my\s+cloud\s+store)\b/i.test(norm)) return 'project:mycloudstore';
  if (/\b(?:explore\s+the\s+globe|explore\s+globe)\b/i.test(norm)) return 'project:explore-the-globe';
  if (/\btoolock\b/i.test(norm)) return 'project:toolock';
  if (/\bresuvana\b/i.test(norm)) return 'project:resuvana';
  if (/\bcookpro\b/i.test(norm)) return 'project:cookpro';

  // Portfolio General
  if (/\b(?:contact|email|mail|reach\s+out|reach\s+him|reach\s+jaya|get\s+in\s+touch)\b/i.test(norm)) return 'portfolio:contact';
  if (/\b(?:who\s+is\s+jaya|tell\s+me\s+about\s+jaya|about\s+jaya|who\s+is\s+he|detailed\s+introduction)\b/i.test(norm)) return 'portfolio:bio';
  if (/\b(?:all\s+his\s+projects|all\s+projects|his\s+projects|what\s+has\s+he\s+built|tell\s+me\s+about\s+his\s+projects|projects\s+he\s+built)\b/i.test(norm)) return 'portfolio:projects';
  if (/\b(?:projects?\s+uses?\s+encryption|which\s+project\s+uses\s+encryption)\b/i.test(norm)) return 'portfolio:encryption_projects';
  if (/\b(?:academic|education|college|school|cvr)\b/i.test(norm)) return 'portfolio:academic';
  if (/\b(?:toolkit|skills|technologies\s+does\s+he\s+use)\b/i.test(norm)) return 'portfolio:toolkit';
  if (/\b(?:certif|credential)\b/i.test(norm)) return 'portfolio:certifications';
  if (/\b(?:lorven|founder|coo)\b/i.test(norm)) return 'portfolio:lorven';

  // Cybersecurity
  if (/\b(?:phishing)\b/i.test(norm)) return 'cybersecurity:phishing';
  if (/\b(?:firewall)\b/i.test(norm)) return 'cybersecurity:firewall';
  if (/\b(?:vpn)\b/i.test(norm)) return 'cybersecurity:vpn';
  if (/\b(?:zero\s+trust)\b/i.test(norm)) return 'cybersecurity:zero_trust';
  if (/\b(?:what\s+is\s+encryption|define\s+encryption|importance\s+of\s+encryption)\b/i.test(norm)) return 'cybersecurity:encryption';

  // General Tech
  if (/\b(?:what\s+is\s+(?:an?\s+)?api|define\s+api)\b/i.test(norm)) return 'tech:api';
  if (/\b(?:what\s+is\s+tcp|define\s+tcp)\b/i.test(norm)) return 'tech:tcp';
  if (/\b(?:what\s+is\s+dns|define\s+dns)\b/i.test(norm)) return 'tech:dns';
  if (/\b(?:what\s+is\s+docker|define\s+docker)\b/i.test(norm)) return 'tech:docker';

  return null;
}

/**
 * Scans conversation history backwards to determine the active topic domain.
 * When the user introduces a new topic, it becomes the active topic.
 */
export function getActiveTopic(messages) {
  if (!messages || messages.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const text = msg.content || '';
    const norm = normalizeCasualText(text);

    // If a user message defined a clear topic
    const userTopic = determineMessageTopic(text, norm);
    if (userTopic) {
      return userTopic;
    }

    // Inspect assistant content for topic keywords
    if (msg.role === 'assistant') {
      const lower = text.toLowerCase();
      if (lower.includes('crash landing on you') || lower.includes('vincenzo') || lower.includes('k-drama')) {
        return 'kdramas';
      }
      if (lower.includes('inception') || lower.includes('parasite') || lower.includes('interstellar') || (lower.includes('movie') && lower.includes('recommendation'))) {
        return 'movies';
      }
      if (lower.includes('ramen') || lower.includes('biryani') || lower.includes('wood-fired pizza')) {
        return 'food';
      }
      if (lower.includes('### doomchat') || lower.includes('doomchat')) {
        return 'project:doomchat';
      }
      if (lower.includes('### vaultix') || lower.includes('vaultix')) {
        return 'project:vaultix';
      }
      if (lower.includes('### mycloudstore') || lower.includes('mycloudstore')) {
        return 'project:mycloudstore';
      }
      if (lower.includes('### explore the globe')) {
        return 'project:explore-the-globe';
      }
      if (lower.includes('### toolock')) {
        return 'project:toolock';
      }
      if (lower.includes('### resuvana')) {
        return 'project:resuvana';
      }
      if (lower.includes('### cookpro')) {
        return 'project:cookpro';
      }
      if (lower.includes('contact information') || lower.includes('let\'s connect') || lower.includes('vardhanbillakanti125@gmail.com')) {
        return 'portfolio:contact';
      }
      if (lower.includes('### detailed introduction') || lower.includes('billakanti jaya vardhan')) {
        return 'portfolio:bio';
      }
      if (lower.includes('### all 8 verified projects')) {
        return 'portfolio:projects';
      }
      if (lower.includes('phishing in depth') || lower.includes('phishing is a type')) {
        return 'cybersecurity:phishing';
      }
      if (lower.includes('firewall') && lower.includes('network security')) {
        return 'cybersecurity:firewall';
      }
    }
  }

  return null;
}

/**
 * Dedicated handler for leisure, pop culture & general recommendations (K-Dramas, Movies, Food, Books)
 * Directly handles initial recommendations AND multi-turn follow-ups ("do it", "give me more", "which one is best?")
 */
export function handleRecommendations(userText, lower, norm, activeTopic, messages) {
  const isKdramaExplicit = /\b(?:k-?dramas?|korean\s+dramas?|kdaramas?)\b/i.test(norm) ||
    (/\b(?:crash\s+landing\s+on\s+you|vincenzo|goblin|itaewon)\b/i.test(norm));

  const isMovieExplicit = (/\b(?:movies?|films?|cinema)\b/i.test(norm) &&
    /\b(?:suggest|recommend|watch|give\s+me|best|good|list)\b/i.test(norm)) ||
    /\b(?:inception|interstellar|parasite|the\s+prestige|shutter\s+island)\b/i.test(norm);

  const isFoodExplicit = /\b(?:favorite\s+food|fav\s+food|recommend\s+food|suggest\s+food|what\s+should\s+i\s+eat|what\s+to\s+eat)\b/i.test(norm) ||
    (/\bfood\b/i.test(norm) && /\b(?:favorite|suggest|recommend|eat|like|best)\b/i.test(norm));

  const isBookExplicit = /\b(?:books?|novel|reading)\b/i.test(norm) &&
    /\b(?:suggest|recommend|read|list|best)\b/i.test(norm);

  const isFollowUp = 
    /^(?:do\s+it|give\s+me\s+more|more|another\s+one|another|continue|next|go\s+on|one\s+more|show\s+me\s+more)\b/i.test(norm) ||
    /^(?:which\s+one\s+is\s+best|which\s+is\s+best|which\s+one|what's\s+the\s+best\s+one|best\s+one)\b/i.test(norm) ||
    /^(?:something\s+romantic|romantic|comedy|thriller|action|sci-?fi)\b/i.test(norm) ||
    norm === 'do it' || norm === 'do it!' || norm === 'do it.' || norm === 'more';

  // --- K-DRAMAS ---
  if (isKdramaExplicit || (activeTopic === 'kdramas' && isFollowUp)) {
    // 1. "which one is best?"
    if (/\b(?:which\s+one\s+is\s+best|which\s+is\s+best|best\s+one|which\s+one)\b/i.test(norm)) {
      return `It really depends on what vibe you're in the mood for:\n\n- **For Romance & Chemistry**: You can't go wrong with **Crash Landing on You** or **Business Proposal** — pure comfort watch and great humor.\n- **For Action & Anti-Hero Thrills**: **Vincenzo** is unmatched.\n- **For Deep Emotional Storytelling**: **My Mister** or **Twenty-Five Twenty-One**.\n- **For Gripping Crime & Mystery**: **Signal** or **Stranger**.\n\nIf you want the ultimate crowd favorite to start with, go with **Crash Landing on You**! 😄`;
    }

    // 2. "something romantic"
    if (/\b(?:romantic|romance|love\s+story)\b/i.test(norm)) {
      return `For pure romance and great chemistry, here are the best picks:\n\n1. **Crash Landing on You** — Iconic romance with incredible heart and comedy.\n2. **Business Proposal** — Fast-paced, laugh-out-loud rom-com.\n3. **Weightlifting Fairy Kim Bok-joo** — Wholesome college athletes falling in love.\n4. **Our Beloved Summer** — Nuanced, nostalgic lovers-to-enemies-to-lovers story.\n5. **Hometown Cha-Cha-Cha** — Warm seaside romance that feels like a hug.\n\nEnjoy watching! 😄`;
    }

    // 3. "do it", "give me more", "another one", "more" (when already in kdramas topic)
    if (isFollowUp && activeTopic === 'kdramas') {
      return `Here are 5 more fantastic K-dramas for your watchlist:\n\n1. **Twenty-Five Twenty-One** — Youth, fencing dreams, and nostalgia set in the late 90s.\n2. **Business Proposal** — A hilarious blind-date mix-up between an employee and her CEO.\n3. **Signal** — Detectives from 1989 and 2015 communicate via walkie-talkie to solve cold cases.\n4. **Stranger (Secret Forest)** — An emotionless prosecutor and a warm detective uncover elite corruption.\n5. **My Mister** — A deeply moving story of two weary people finding healing and solace.\n\nWhich vibe do you feel like watching tonight?`;
    }

    // 4. Initial K-drama suggestion ("Suggest me some kdramas")
    return `Here are some top K-drama recommendations across different vibes:\n\n1. **Crash Landing on You** — Romance / Drama (A South Korean heiress accidentally paraglides into North Korea and meets a dedicated army officer).\n2. **Vincenzo** — Action / Dark Comedy / Crime (A Korean-Italian mafia lawyer returns to Seoul to recover hidden gold and delivers vigilante justice).\n3. **Goblin (Guardian: The Lonely and Great God)** — Fantasy / Romance (An immortal goblin seeks a human bride to end his curse).\n4. **Itaewon Class** — Revenge / Youth Drama (An ex-convict and his friends battle against a massive food conglomerate to build their own pub empire).\n5. **Hospital Playlist** — Slice of Life / Friendship / Medical (Five doctors who have been close friends since medical school share life, love, and a weekend band).\n\nLet me know what genre you prefer, or say "more" or "which one is best?"! 😄`;
  }

  // --- MOVIES ---
  if (isMovieExplicit || (activeTopic === 'movies' && isFollowUp)) {
    // 1. "which one is best?"
    if (/\b(?:which\s+one\s+is\s+best|which\s+is\s+best|best\s+one|which\s+one)\b/i.test(norm)) {
      return `If you're picking one:\n- For **mind-bending sci-fi**: Watch **Inception** or **Interstellar**.\n- For **unpredictable thrill and suspense**: Watch **Parasite** or **The Prestige**.\n- For **pure cinematic tension**: Watch **Whiplash**.\n\nIf you want an unforgettable watch right now, start with **Inception**! 🍿`;
    }

    // 2. "give me more", "more", "another one", "do it"
    if (isFollowUp && activeTopic === 'movies') {
      return `Here are 5 more exceptional movies to add to your list:\n\n1. **The Prestige** (Mystery / Drama) — Two rival magicians obsessively try to create the ultimate illusion.\n2. **Shutter Island** (Psychological Thriller) — A U.S. Marshal investigates the disappearance of a patient from an isolated psychiatric facility.\n3. **Whiplash** (Drama / Music) — A fiercely intense psychological battle between an ambitious young jazz drummer and a ruthless instructor.\n4. **Knives Out** (Whodunnit / Mystery) — A sharp, stylish, witty modern murder mystery.\n5. **Everything Everywhere All at Once** (Sci-Fi / Comedy) — A wild, creative multiversal adventure centered on family and empathy.\n\nAny of these catch your eye? 🍿`;
    }

    // 3. Initial movie suggestion
    return `Here are some top movie recommendations across different genres:\n\n1. **Inception** (Sci-Fi / Heist) — Christopher Nolan's mind-bending journey through nested dream layers.\n2. **Parasite** (Thriller / Drama) — Bong Joon-ho's razor-sharp social satire and gripping masterclass.\n3. **Interstellar** (Sci-Fi / Drama) — An epic space voyage through a wormhole exploring love, time dilation, and survival.\n4. **The Dark Knight** (Action / Crime) — Peak superhero cinema anchored by Heath Ledger's iconic Joker.\n5. **Spider-Man: Into the Spider-Verse** (Animation / Action) — A visual and narrative masterpiece of multiverse storytelling.\n\nLooking for a specific genre like sci-fi, thriller, comedy, or mind-bending cinema? Just let me know or say "more"! 🍿`;
  }

  // --- FOOD ---
  if (isFoodExplicit || (activeTopic === 'food' && isFollowUp)) {
    return `I might run on code and electricity, but if I could eat, I'd definitely go for:\n\n1. **Ramen** — Rich, steaming broth with fresh noodles and soft-boiled egg 🍜\n2. **Biryani** — Fragrant, spiced basmati rice layered with rich aromas\n3. **Wood-fired Pizza** — Crispy thin crust, fresh basil, and bubbling mozzarella 🍕\n4. **Tacos** — Fresh lime, salsa, and savory fillings 🌮\n\nWhat's your all-time favorite food? 😄`;
  }

  // --- BOOKS ---
  if (isBookExplicit || (activeTopic === 'books' && isFollowUp)) {
    return `Here are a few standout book recommendations depending on what you like:\n\n1. **Atomic Habits** by James Clear (Productivity & Personal Growth)\n2. **Project Hail Mary** by Andy Weir (Exciting, ingenious Sci-Fi)\n3. **The Psychology of Money** by Morgan Housel (Timeless lessons on wealth and greed)\n4. **1984** by George Orwell (Dystopian classic)\n\nWhat kind of books do you enjoy reading? 📚`;
  }

  return null;
}

/**
 * Resolves ordinal references to previous project lists ("first project", "second one")
 */
export function resolveOrdinalFollowUp(text, lower, messages) {
  const ordinalPatterns = [
    { regex: /\b(?:first|1st|number\s+1|#1)\s*(?:one|project)?\b/i, index: 0 },
    { regex: /\b(?:second|2nd|number\s+2|#2)\s*(?:one|project)?\b/i, index: 1 },
    { regex: /\b(?:third|3rd|number\s+3|#3)\s*(?:one|project)?\b/i, index: 2 },
    { regex: /\b(?:fourth|4th|number\s+4|#4)\s*(?:one|project)?\b/i, index: 3 },
    { regex: /\b(?:fifth|5th|number\s+5|#5)\s*(?:one|project)?\b/i, index: 4 },
    { regex: /\b(?:sixth|6th|number\s+6|#6)\s*(?:one|project)?\b/i, index: 5 },
    { regex: /\b(?:seventh|7th|number\s+7|#7)\s*(?:one|project)?\b/i, index: 6 },
    { regex: /\b(?:eighth|8th|number\s+8|#8|last)\s*(?:one|project)?\b/i, index: 7 }
  ];

  let matchedIndex = -1;
  for (const item of ordinalPatterns) {
    if (item.regex.test(lower)) {
      matchedIndex = item.index;
      break;
    }
  }

  if (matchedIndex === -1) return null;

  for (let i = messages.length - 2; i >= 0; i--) {
    const content = messages[i].content || '';
    if (content.includes('Verified Projects') || content.includes('VAULTIX') || content.includes('DoomChat')) {
      const projectId = ORDERED_PROJECT_IDS[matchedIndex];
      if (projectId) {
        return PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === projectId);
      }
    }
  }

  return null;
}

/**
 * Handles Portfolio, Project, Academic, and Personal Questions
 * Authoritative, verified facts strictly from https://vardhanbillakanti.in.
 */
export function handlePortfolioQuery(userText, lower, prevContext, messages) {
  // 1. Unknown / Fictional Entities Guard (e.g. "BridgeTwin")
  if (lower.includes('bridgetwin') || lower.includes('bridge twin')) {
    return "I don't have information about a project named **BridgeTwin** in the portfolio yet.\n\nThe 8 verified projects currently available in the portfolio are:\n\n1. **VAULTIX** (Cloud Storage & Privacy)\n2. **DoomChat** (Real-Time End-to-End Encrypted Chat)\n3. **MyCloudStore** (Cloud & Storage Vault)\n4. **Explore The Globe** (Interactive 3D Geography)\n5. **Toolock** (Client-Side Privacy Utilities)\n6. **Resuvana** (ATS Professional Resume Builder)\n7. **CookPro** (Smart Recipe Discovery)\n8. **Portfolio** (Personal Portfolio & Web)";
  }

  if (prevContext.includes('bridgetwin') || prevContext.includes('bridge twin')) {
    const isFollowUp = /\b(?:it|this\s+project|that\s+project|technolog|built\s+with|tech\s+stack|why\s+was\s+it\s+built|purpose)\b/i.test(lower);
    if (isFollowUp) {
      return "As mentioned, **BridgeTwin** is not an active project in the portfolio, so there is no tech stack documented for it. If you're curious about real projects with advanced tech stacks, check out **DoomChat** (Cloudflare Workers, Durable Objects, Web Crypto API) or **VAULTIX** (React, TypeScript, AES-256-GCM)!";
    }
  }

  // 2. Hybrid Intelligence: "Which of Jaya's projects uses encryption?" (Section 20)
  if (/\b(?:projects?\s+uses?\s+encryption|which\s+(?:of\s+jaya'?s\s+)?projects?\s+uses?\s+encryption|encryption\s+projects?)\b/i.test(lower)) {
    return `### Projects Utilizing Encryption\n\nBased on the verified portfolio on **https://vardhanbillakanti.in**, three projects implement cryptographic encryption:\n\n1. **DoomChat** (Real-Time & Security)\n   - Implements zero-knowledge, end-to-end client-side encryption using the browser's native **Web Crypto API (AES-GCM 256-bit)**.\n   - Encryption keys are derived client-side using **PBKDF2 (100,000+ iterations)** from room passphrases, ensuring message contents never reach servers unencrypted.\n\n2. **VAULTIX** (Cloud Storage & Privacy)\n   - Implements **AES-256-GCM** authenticated file-level encryption and **bcrypt** credential hashing before uploading files to personal Google Drive storage.\n\n3. **Toolock** (Privacy-Centric Web Utilities)\n   - Unifies client-side cryptographic hashing (SHA-256), token inspection, and text encoding with **100% in-memory processing**, guaranteeing user files never touch a server.`;
  }

  // 3. Direct Website Query: "Show me his portfolio." / "Where can I see his portfolio?"
  const isDirectPortfolioSiteQuery = 
    lower.includes('show me his portfolio') || 
    lower.includes('show his portfolio') || 
    lower.includes('show portfolio') || 
    lower.includes('show the portfolio') || 
    lower.includes('portfolio website') || 
    lower.includes('his website') || 
    lower.includes('portfolio link') || 
    lower.includes('visit his portfolio') || 
    lower.includes('view his portfolio') ||
    lower.trim() === 'show me his portfolio.' ||
    lower.trim() === 'show me his portfolio';

  if (isDirectPortfolioSiteQuery) {
    return `You can explore Billakanti Jaya Vardhan's official portfolio website at:\n\n[https://vardhanbillakanti.in](https://vardhanbillakanti.in)\n\nIt features his academic journey, interactive technical toolkit, all 8 live projects, verified certifications, and Lorven Enterprise.`;
  }

  // 4. Ordinal Follow-Up Resolution (e.g. "Tell me more about the first project")
  let targetProject = resolveOrdinalFollowUp(userText, lower, messages);

  // 5. Direct Project Name Search
  if (!targetProject) {
    if (lower.includes('vaultix')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'vaultix');
    else if (lower.includes('doomchat') || lower.includes('doom chat')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'doomchat');
    else if (lower.includes('mycloudstore') || lower.includes('cloud store') || lower.includes('my cloud store')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'mycloudstore');
    else if (lower.includes('explore the globe') || lower.includes('explore globe') || lower.includes('3d earth')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'explore-the-globe');
    else if (lower.includes('toolock')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'toolock');
    else if (lower.includes('resuvana') || lower.includes('resume builder')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'resuvana');
    else if (lower.includes('cookpro') || lower.includes('recipe discovery') || lower.includes('recipe app')) targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'cookpro');
    else if (lower.includes('portfolio 2.0') || (lower.includes('portfolio') && !lower.includes('all') && !lower.includes('what') && !lower.includes('tell') && !lower.includes('his') && !lower.includes('show') && !lower.includes('nice'))) {
      targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'portfolio');
    }
  }

  // Multi-turn pronoun resolution ("it", "this project", "that project", "tell me more", "how does it work")
  const isFollowUp = /^(?:tell\s+me\s+more|explain\s+more|go\s+deeper|more\s+details|what\s+technologies|what\s+tech|why\s+was\s+it\s+built|why\s+did\s+he\s+build\s+it|how\s+does\s+it\s+work|technologies\s+used|what\s+about\s+it|what\s+was\s+the\s+purpose|purpose\s+of\s+it)\b/i.test(lower) ||
    /\b(?:this\s+project|that\s+project|the\s+project)\b/i.test(lower) ||
    /\b(?:how\s+does\s+it\s+work|what\s+technologies\s+does\s+it\s+use)\b/i.test(lower);

  if (!targetProject && isFollowUp) {
    // Only resolve to a project if the immediately active topic in recent conversation is indeed a project
    const activeTopic = getActiveTopic(messages ? messages.slice(0, -1) : []);
    if (activeTopic && activeTopic.startsWith('project:')) {
      const projId = activeTopic.split(':')[1];
      targetProject = PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === projId);
    }
  }

  // Specific Project Details
  if (targetProject) {
    if (lower.includes('technolog') || lower.includes('tech stack') || lower.includes('built with') || lower.includes('tools used') || lower.includes('what tech')) {
      return `### ${targetProject.title} — Technologies Used\n\n**Category**: ${targetProject.category} (${targetProject.year})\n\n**Core Tech Stack**:\n${targetProject.technologies.map(t => `- **${t}**`).join('\n')}\n\n**Live Application**: [${targetProject.liveUrl}](${targetProject.liveUrl})`;
    }

    if (lower.includes('purpose') || lower.includes('why') || lower.includes('objective') || lower.includes('problem')) {
      return `### ${targetProject.title} — Purpose & Problem Solved\n\n**Category**: ${targetProject.category} (${targetProject.year})\n\n**Problem & Purpose**:\n${targetProject.purpose}\n\n**Project Description**:\n${targetProject.description}\n\n**Live Application**: [${targetProject.liveUrl}](${targetProject.liveUrl})`;
    }

    if (lower.includes('website') || lower.includes('link') || lower.includes('url') || lower.includes('live')) {
      return `The live website for **${targetProject.title}** is: [${targetProject.liveUrl}](${targetProject.liveUrl})\n\nIt is a ${targetProject.category} project (${targetProject.year}).`;
    }

    let response = `### ${targetProject.title} (${targetProject.category} • ${targetProject.year})\n\n`;
    response += `**Overview**:\n${targetProject.description}\n\n`;
    response += `**Purpose & Problem Solved**:\n${targetProject.purpose}\n\n`;
    response += `**Technologies Used**:\n${targetProject.technologies.join(' • ')}\n\n`;

    if (targetProject.technicalImplementation) {
      response += `**Technical Implementation Details**:\n${targetProject.technicalImplementation.map(item => `- ${item}`).join('\n')}\n\n`;
    } else if (targetProject.highlights) {
      response += `**Key Highlights**:\n${targetProject.highlights.map(item => `- ${item}`).join('\n')}\n\n`;
    }

    if (targetProject.securitySignificance) {
      response += `**Security Architecture**:\n${targetProject.securitySignificance}\n\n`;
    }

    response += `**Live Project URL**: [${targetProject.liveUrl}](${targetProject.liveUrl})`;
    return response;
  }

  // 0. Verified Personal Links & Contact Grounding (Strict Zero-Hallucination)
  const norm = normalizeCasualText(userText);
  const linkAnswer = detectVerifiedPersonalLink(userText, norm, lower);
  if (linkAnswer !== null) {
    return linkAnswer;
  }

  // "Which project is the most technically interesting?" / Recommendations
  if (lower.includes('most technically interesting') || lower.includes('technically interesting') || lower.includes('recommend a project') || lower.includes('best project') || lower.includes('favorite project')) {
    return `### Most Technically Interesting Projects\n\nBased on architectural depth and security engineering on **https://vardhanbillakanti.in**, the two standout projects are:\n\n1. **DoomChat** (Real-Time & Security)\n   - **Why it's interesting**: Implements a zero-knowledge architecture where message contents are encrypted client-side using the browser's native **Web Crypto API (AES-GCM 256-bit)** with keys derived from passphrases via **PBKDF2 (100,000+ iterations)**. It pairs this with **Cloudflare Workers & Durable Objects** using the **WebSocket Hibernation API** to maintain real-time signaling while running zero server logging.\n   - **Live System**: [https://doomchat.vercel.app/](https://doomchat.vercel.app/)\n\n2. **VAULTIX** (Cloud Storage & Privacy)\n   - **Why it's interesting**: Rather than building another centralized cloud silo, VAULTIX connects directly to each user's personal **Google Drive API** as the raw storage provider while applying an independent security layer (**AES-256-GCM**, **bcrypt**, **Express**, and **Turso/libSQL**).\n   - **Live System**: [https://myvaultix.vercel.app/](https://myvaultix.vercel.app/)\n\nFor 3D graphics, **Explore The Globe** is also notable for its Three.js/WebGL Earth visualization and GeoJSON raycasting.`;
  }

  // "Tell me about his cybersecurity work." / "Cybersecurity projects"
  if (lower.includes('cybersecurity work') || lower.includes('cyber security work') || lower.includes('cybersecurity project') || lower.includes('cyber security project') || lower.includes('security focus') || lower.includes('security work')) {
    return `### Cybersecurity Work & Security Engineering\n\nJaya Vardhan's focus in cybersecurity centers on **cryptographic protocols, zero-knowledge communication, privacy-preserving cloud storage, and defensive software architecture**.\n\nHis primary cybersecurity initiatives on the portfolio are:\n\n1. **DoomChat (Real-Time & Security)**\n   - **Zero-Knowledge Architecture**: Messages are encrypted locally in the user's browser before reaching edge networks.\n   - **Web Crypto API**: Utilizes client-side **AES-GCM (256-bit)** authenticated encryption.\n   - **Key Derivation**: **PBKDF2 with 100,000+ iterations** and salt to thwart brute-force attacks.\n   - **Ephemeral Edge Signaling**: Runs on **Cloudflare Workers & Durable Objects** with WebSocket Hibernation and self-destructing rooms.\n\n2. **VAULTIX (Cloud Storage & Privacy)**\n   - Privacy-focused cloud storage platform that decouples file storage from application servers.\n   - Utilizes **AES-256-GCM encryption**, **bcrypt credential hashing**, and scoped **Google OAuth 2.0** permissions.\n\n3. **Toolock (Privacy-Centric Utilities)**\n   - Unifies file manipulation and cryptographic utilities (SHA-256 hash generation, token inspection, encoding) with **100% client-side in-memory processing**, guaranteeing user files never touch a server.\n\n4. **Academic Focus at CVR College of Engineering**:\n   - Pursuing B.Tech in CSE with specialization in Cyber Security, focusing on information security, network defense, Linux/Kali Linux environments, and system vulnerability assessment.`;
  }

  // "What has he built?" / "Explain all his projects." / "Tell me about his projects." / "Tell me about my projects"
  if (lower.includes('all his projects') || lower.includes('all my projects') || lower.includes('all projects') || lower.includes('what has he built') || lower.includes('what have i built') || lower.includes('what projects has he built') || lower.includes('what projects have i built') || lower.includes('explain all projects') || lower.includes('list projects') || (lower.includes('projects') && (lower.includes('what') || lower.includes('tell') || lower.includes('list') || lower.includes('show') || lower.includes('his') || lower.includes('my') || lower.includes('built')))) {
    return `### All 8 Verified Projects Built by Billakanti Jaya Vardhan\n\nDirectly from **https://vardhanbillakanti.in/projects**:\n\n1. **VAULTIX** *(Cloud Storage & Privacy • 2026)*\n   - Privacy-focused personal cloud storage using each user's Google Drive with AES-256-GCM encryption, folders, notes, and trash.\n   - *Tech*: React, TypeScript, Vite, Node.js, Express, Turso/libSQL, Google Drive API, AES-256-GCM | [Live](https://myvaultix.vercel.app/)\n\n2. **DoomChat** *(Real-Time & Security • 2026)*\n   - Ephemeral real-time chat with client-side AES-GCM encryption via Web Crypto API and Cloudflare Durable Objects.\n   - *Tech*: React 18, TypeScript, Cloudflare Workers, Durable Objects, WebSockets, AES-GCM, PBKDF2 | [Live](https://doomchat.vercel.app/)\n\n3. **MyCloudStore** *(Cloud & Storage • 2026)*\n   - Personal cloud storage for uploading, organizing, previewing, and managing files with a PIN-protected Secure Vault.\n   - *Tech*: Next.js, React, TypeScript, MongoDB Atlas, Vercel Blob | [Live](https://mycloudstore.vercel.app/)\n\n4. **Explore The Globe** *(Interactive & Exploration • 2026)*\n   - Interactive 3D geography experience exploring Earth in WebGL, country selection, and regional data.\n   - *Tech*: HTML5, CSS3, JavaScript, WebGL, GeoJSON | [Live](https://exploreglobe.vercel.app/)\n\n5. **Toolock** *(All-in-One Tools & Web • 2026)*\n   - All-in-one digital tools suite with 100% client-side file processing, PDF tools, image conversion, and 3D visual experience.\n   - *Tech*: Next.js, React, TypeScript, Three.js/WebGL, Browser APIs | [Live](https://toolock.vercel.app/)\n\n6. **Resuvana** *(Professional Resume Builder • 2026)*\n   - Modern resume builder featuring 6 ATS-conscious templates, real-time multi-page A4 preview, and PDF export.\n   - *Tech*: Next.js, React, TypeScript, Tailwind CSS, Local Storage, PDF Generation | [Live](https://resuvana.vercel.app/)\n\n7. **CookPro** *(Smart Recipe Discovery • 2026)*\n   - Smart ingredient-matching platform calculating match percentages, relevance ranking, personal pantry, and shopping lists.\n   - *Tech*: React, TypeScript, Vite, Node.js, MongoDB Atlas, TheMealDB API | [Live](https://cookpro.vercel.app/)\n\n8. **Portfolio** *(Portfolio & Web • 2026)*\n   - A modern personal portfolio showcasing his academic journey, technical skills, certifications, and projects.\n   - *Tech*: HTML5, CSS3, JavaScript, EmailJS, Git, GitHub, Vercel | [Live](https://vardhanbillakanti.in/)\n\nAsk me for a deep dive into any specific project!`;
  }

  // Contact / Direct Reach Out / Email & Social Links
  if (/\b(?:contact|reach\s+out|reach\s+him|reach\s+jaya|get\s+in\s+touch|message\s+him)\b/i.test(lower) || lower.includes('social link')) {
    const c = PORTFOLIO_KNOWLEDGE.contact;
    return `### Contact Information\n\nYou can reach **Billakanti Jaya Vardhan** directly via:\n\n- **Email**: [${c.email}](mailto:${c.email})\n- **GitHub**: [${c.github}](${c.github})\n- **LinkedIn**: [${c.linkedin}](${c.linkedin})\n- **Instagram**: [${c.instagram}](${c.instagram})\n- **Official Website**: [${c.portfolioUrl}](${c.portfolioUrl})\n\nYou can also click the **GET IN TOUCH** control in the top navigation to send a direct message.`;
  }

  // "Who is Jaya Vardhan?" / "Tell me about Jaya Vardhan." / "Detailed introduction."
  const isAskingWhoIsJaya = 
    /\b(?:who\s+is\s+(?:billakanti\s+)?jaya(?:\s+vardhan)?|who\s+is\s+he)\b/i.test(lower) ||
    /\b(?:tell\s+me\s+about\s+(?:billakanti\s+)?jaya(?:\s+vardhan)?|tell\s+me\s+about\s+him)\b/i.test(lower) ||
    /\b(?:about\s+(?:billakanti\s+)?jaya(?:\s+vardhan)?|about\s+him)\b/i.test(lower) ||
    /\b(?:detailed\s+introduction|introduce\s+(?:billakanti\s+)?jaya(?:\s+vardhan)?|introduce\s+him)\b/i.test(lower) ||
    /^(?:who\s+is\s+jaya\??|tell\s+me\s+about\s+jaya\??)$/i.test(lower) ||
    /^(?:jaya\s+vardhan|billakanti\s+jaya\s+vardhan)\??$/i.test(lower);

  const isSelfIdInQuery = 
    /\b(?:i\s*am|i'?m|im|myself|it'?s\s+me|its\s+me|this\s+is)\s+(?:only\s+)?(?:bro\s+)?jaya(?:\s+vardhan)?(?:\s+myself)?\b/i.test(lower) ||
    /\bjaya\s+here\b/i.test(lower);

  if (isAskingWhoIsJaya && !isSelfIdInQuery && !/\b(?:contact|email|mail|reach|study|college|school|certif|project)\b/i.test(lower)) {
    return `### Detailed Introduction — Billakanti Jaya Vardhan\n\n**Billakanti Jaya Vardhan** (also known as Jaya Vardhan Billakanti) is a developer and technology enthusiast focused on **Cyber Security, software systems, and digital innovation**.\n\n#### Current Pursuit & Academics\n- **B.Tech in Computer Science & Engineering (Cyber Security)** at **CVR College of Engineering**, Hyderabad (2025 — Present).\n- Strengthening foundations in information security, network defense, system cryptography, and modern software engineering.\n\n#### Entrepreneurship & Leadership\n- **Co-Founder & Chief Operating Officer (COO)** of **Lorven Enterprise**, overseeing operational execution, product development, and building modern growth & secure digital systems.\n\n#### Engineering Focus & Core Philosophy\n- Explores how technology can solve real-world problems and turn ideas into practical digital products.\n- Focuses on offensive security, zero-knowledge architectures, privacy-preserving cloud storage, and full-stack systems.\n- Author of 8 verified projects spanning encrypted communication (DoomChat), cloud storage (VAULTIX, MyCloudStore), 3D graphics (Explore The Globe), privacy utilities (Toolock), and productivity tools (Resuvana, CookPro).\n\nHis official portfolio is live at [https://vardhanbillakanti.in](https://vardhanbillakanti.in).`;
  }

  // Academic Background / Education
  if (lower.includes('academic background') || lower.includes('academic journey') || lower.includes('education') || lower.includes('study') || lower.includes('college') || lower.includes('university') || lower.includes('school') || lower.includes('cvr')) {
    const acad = PORTFOLIO_KNOWLEDGE.academicBackground;
    return `### Academic Background — The Foundation\n\n*${acad.intro}*\n\nJaya Vardhan's academic milestones:\n\n1. **Milestone 01 — Current Stage (2025 — Present)**:\n   - **Degree**: B.Tech in Computer Science & Engineering (Cyber Security)\n   - **Institution**: **CVR College of Engineering**, Hyderabad ([cvr.ac.in](https://cvr.ac.in/home4/))\n   - **Status**: Currently Pursuing\n   - *\"This is where I'm building my technical foundation and exploring my interests in Cyber Security, technology, innovation, and entrepreneurship.\"*\n\n2. **Milestone 02 — Intermediate (2023 — 2025)**:\n   - **Education**: Senior Secondary / Intermediate (MPC — Mathematics, Physics, Chemistry)\n   - **Institution**: **Motion Junior College**, Madhapur, Hyderabad\n   - **Status**: Completed\n   - *\"This stage strengthened my academic foundation and prepared me for the transition into engineering.\"*\n\n3. **Milestone 03 — Secondary Education (2023)**:\n   - **Education**: Class 10\n   - **Institution**: **Bhashyam Blooms**, Maheshwaram, Hyderabad ([bloomsmaheswaram.in](https://bloomsmaheswaram.in/))\n   - **Status**: Completed\n   - *\"Formed an important early foundation in my academic journey and helped shape my approach toward learning and growth.\"*`;
  }

  // "Which technologies does he use?" / "Skills" / "Toolkit"
  if (lower.includes('technologies does he use') || lower.includes('skills') || lower.includes('toolkit') || lower.includes('tools he uses') || lower.includes('tech stack') || lower.includes('programming languages') || (lower.includes('tools') && lower.includes('he'))) {
    return `### Technical Toolkit — Tools I Build With\n\nFrom the interactive toolkit on [https://vardhanbillakanti.in](https://vardhanbillakanti.in) (categorized by active use status):\n\n- **Programming Languages**:\n  - *Actively Using*: JavaScript\n  - *Exploring*: TypeScript, Python, Java, C\n\n- **Web Development**:\n  - *Actively Using*: HTML, CSS\n  - *Exploring*: React, Node.js, Next.js\n\n- **Systems & Security**:\n  - *Actively Using*: Linux\n  - *Exploring*: Kali Linux\n\n- **Databases & Backend**:\n  - *Actively Using*: SQL\n  - *Exploring*: MySQL, MongoDB, Firebase, Supabase, SQLite\n\n- **Cloud & Infrastructure**:\n  - *Exploring*: Vercel, Cloudflare, AWS, Google Cloud, Kubernetes\n\n- **AI & Development Tools**:\n  - *Actively Using*: Visual Studio Code, ChatGPT, Google Gemini\n  - *Exploring*: PyTorch\n\n- **Version Control**:\n  - *Actively Using*: Git, GitHub\n\n- **Creative**:\n  - *Actively Using*: Canva, CapCut\n\nIn addition, his engineering practices incorporate **AES-GCM encryption, PBKDF2 key derivation, Web Crypto API, bcrypt, and Google OAuth 2.0**.`;
  }

  // "What certifications does he have?" / "Certifications"
  if (lower.includes('certification') || lower.includes('credentials') || lower.includes('certificate') || lower.includes('courses')) {
    return `### Verified Certifications & Credentials\n\nAll 11 certifications from the curated credentials deck on [https://vardhanbillakanti.in](https://vardhanbillakanti.in):\n\n1. **Code in Borderland — Certificate of Excellence**\n   - *Issuer*: CVR • ACM (CVR College of Engineering / ACM CVRCE) | *Date*: APR 2026\n   - *Focus*: Distinction in coding competition and algorithmic problem solving.\n\n2. **Git & GitHub Bootcamp**\n   - *Issuer*: LETSUPGRADE (NSDC & GDG MAD) | *Date*: AUG 2026\n   - *Focus*: Version control, branching workflows, pull requests, and collaborative Git.\n\n3. **Data Structures : Deep Dive in C**\n   - *Issuer*: E-BOX (Amphisoft Certified) | *Date*: JUN 2026\n   - *Focus*: Pointers, linked lists, memory allocation, trees, graphs, sorting, complexity.\n\n4. **Crash Course on Python** *(Featured Keystone)*\n   - *Issuer*: GOOGLE (Google / Coursera) | *Date*: AUG 2026\n   - *Focus*: Python fundamentals, OOP, scripting, and system automation.\n\n5. **HTML & CSS Bootcamp**\n   - *Issuer*: LETSUPGRADE (NSDC & GDG MAD) | *Date*: AUG 2026\n   - *Focus*: Semantic HTML5, CSS Flexbox/Grid, and responsive layout standards.\n\n6. **Python Basics for Beginners**\n   - *Issuer*: E-BOX (Amphisoft Certified) | *Date*: JUN 2026\n   - *Focus*: Core Python syntax, conditional logic, control structures, and loops.\n\n7. **TATA Crucible Quiz**\n   - *Issuer*: TATA GROUP (Unstop / Tata Group) | *Date*: 2025\n   - *Focus*: National business, technology, and economic strategy campus quiz.\n\n8. **Marketing Intern**\n   - *Issuer*: INSPIRELEAP (InspireLeap Pvt Ltd) | *Date*: 2025 - 2026\n   - *Focus*: Practical marketing internship, digital campaigns, and operations.\n\n9. **AI Tools & Claude Workshop**\n   - *Issuer*: BE10X | *Date*: SEP 2026\n   - *Focus*: Generative AI tooling, Claude model workflows, and prompt productivity.\n\n10. **Prompt Engineering Bootcamp**\n    - *Issuer*: LETSUPGRADE (NSDC & GDG MAD) | *Date*: AUG 2026\n    - *Focus*: Instruction engineering, context window management, few-shot prompting.\n\n11. **Prompt Engineering Certification Test**\n    - *Issuer*: VAULTOFCODES | *Date*: 2026\n    - *Focus*: Perfect score 100/100 in prompt engineering, problem-solving, and coding fundamentals.`;
  }

  // "What is the Lorven website?" / "Give me the Lorven website"
  if ((lower.includes('lorven') && (lower.includes('website') || lower.includes('url') || lower.includes('link'))) && !lower.includes('founder') && !lower.includes('who') && !lower.includes('leadership')) {
    return "The official website for **Lorven Enterprise** is: [https://lorven.vercel.app/](https://lorven.vercel.app/)";
  }

  // "Give me the links of the Lorven founders"
  if ((lower.includes('founder') || lower.includes('leadership')) && (lower.includes('link') || lower.includes('website') || lower.includes('url') || lower.includes('portfolio'))) {
    return `### Verified Links for Lorven Enterprise Founders\n\nHere are the verified websites and portfolios for all three founders:\n\n1. **ReddyGari Vashishta Reddy** *(Founder & CEO)*:\n   - Website: [https://vashishtareddy.vercel.app/](https://vashishtareddy.vercel.app/)\n\n2. **Billakanti Jaya Vardhan** *(Founder & COO)*:\n   - Portfolio: [https://vardhanbillakanti.in/](https://vardhanbillakanti.in/)\n\n3. **Vishwak Pullepu** *(Founder & CTO)*:\n   - Website: [https://vishwak.tech/](https://vishwak.tech/)\n\nOfficial Lorven Website: [https://lorven.vercel.app/](https://lorven.vercel.app/)`;
  }

  // "Tell me about Vishwak Pullepu"
  if (lower.includes('vishwak') || lower.includes('pullepu')) {
    return `**Vishwak Pullepu** is a Co-Founder and the **Chief Technology Officer (CTO)** of **Lorven Enterprise**.\n\nHe leads the technology vision, software architecture, and engineering behind Lorven's digital systems.\n\n- **Website**: [https://vishwak.tech/](https://vishwak.tech/)\n- **Lorven Enterprise**: [https://lorven.vercel.app/](https://lorven.vercel.app/)`;
  }

  // "Tell me about Vashishta Reddy"
  if (lower.includes('vashishta')) {
    return `**ReddyGari Vashishta Reddy** is the **Founder & Chief Executive Officer (CEO)** of **Lorven Enterprise**.\n\nHe is the visionary leader driving strategy, business partnerships, and the overall direction of the company.\n\n- **Website**: [https://vashishtareddy.vercel.app/](https://vashishtareddy.vercel.app/)\n- **Lorven Enterprise**: [https://lorven.vercel.app/](https://lorven.vercel.app/)`;
  }

  // "Who are the founders of Lorven?"
  if (lower.includes('who are the founders') || (lower.includes('founders') && (lower.includes('lorven') || lower.includes('who')))) {
    return `### Founders of Lorven Enterprise\n\nLorven Enterprise was co-founded by:\n\n1. **ReddyGari Vashishta Reddy** — *Founder & CEO (Chief Executive Officer)*\n   - Visionary leader driving strategy, partnerships, and corporate direction.\n   - Website: [https://vashishtareddy.vercel.app/](https://vashishtareddy.vercel.app/)\n\n2. **Billakanti Jaya Vardhan** — *Founder & COO (Chief Operating Officer)*\n   - Overseeing operational execution, product development, and systems.\n   - Portfolio: [https://vardhanbillakanti.in/](https://vardhanbillakanti.in/)\n\n3. **Vishwak Pullepu** — *Founder & CTO (Chief Technology Officer)*\n   - Leading technology vision, architecture, and software engineering.\n   - Website: [https://vishwak.tech/](https://vishwak.tech/)\n\nOfficial Website: [https://lorven.vercel.app/](https://lorven.vercel.app/)`;
  }

  // "What is Lorven Enterprise?"
  if (lower.includes('lorven') || lower.includes('enterprise') || lower.includes('coo')) {
    const l = PORTFOLIO_KNOWLEDGE.lorvenEnterprise;
    return `### Lorven Enterprise — Building Modern Growth & Secure Digital Systems\n\n*\"${l.subheading}\"*\n\n**Overview**:\n${l.overview}\n**Website**: [${l.liveUrl}](${l.liveUrl})\n\n#### Four Strategic Pillars:\n1. **Digital Solutions**: Websites and web applications, digital products, modern online experiences.\n2. **Business Growth**: Digital strategy, growth-focused solutions, brand and business development.\n3. **Technology**: Modern software solutions, AI and emerging technologies, cloud and digital infrastructure.\n4. **Cybersecurity**: Security-focused technology, cybersecurity solutions, safer digital systems.\n\n#### Leadership Team:\n- **ReddyGari Vashishta Reddy** — *Founder & CEO*:\n  Visionary leader driving strategy, partnerships, and the overall direction of Lorven Enterprise. ([Website](https://vashishtareddy.vercel.app/))\n- **Billakanti Jaya Vardhan** — *Founder & COO*:\n  Overseeing operations, product development, and ensuring every system runs with precision and purpose. ([Portfolio](https://vardhanbillakanti.in/))\n- **Vishwak Pullepu** — *Founder & CTO*:\n  Leading the technology vision, architecture, and engineering behind Lorven's digital systems. ([Website](https://vishwak.tech/))`;
  }

  // Interests & Focus Areas
  if (lower.includes('interest') || lower.includes('focus area') || lower.includes('passionate about') || lower.includes('his goal')) {
    return `### Interests & Focus Areas\n\nFrom the portfolio's About and Beyond sections:\n\n- **Primary Highlights**:\n  1. **Cyber Security**: Offensive security, system resilience, and cryptographic protocols.\n  2. **Technology & Innovation**: Architecting practical software products that turn ideas into impactful tools.\n  3. **Entrepreneurship**: Scaling Lorven Enterprise to provide modern growth and secure digital systems.\n\n- **Currently Exploring**:\n  - Web Development\n  - AI & Emerging Technologies\n  - Digital Business\n  - Cyber Security\n\n- **Core Goal**: *\"To continuously learn, create, and build things that make an impact.\"*`;
  }

  return null;
}

/**
 * Smart Context Retrieval Helper (Section 19)
 * Returns only the relevant slice of portfolio knowledge, avoiding unnecessary token bloat.
 */
export function getRelevantPortfolioSlice(messages) {
  if (!messages || messages.length === 0) return null;
  const lastText = (messages[messages.length - 1].content || '').toLowerCase();
  
  const isPersonal = /jaya|vardhan|his|author|developer|founder|lorven|portfolio|project|certif|credential|cvr|motion|bhashyam|toolkit|skills|contact|email|mail|reach/i.test(lastText);
  if (!isPersonal) return null;

  if (/\b(?:contact|email|mail|reach|get\s+in\s+touch)\b/i.test(lastText)) {
    return { contact: PORTFOLIO_KNOWLEDGE.contact };
  }

  if (/doomchat|doom\s+chat/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'doomchat') };
  }
  if (/vaultix/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'vaultix') };
  }
  if (/mycloudstore|cloud\s*store/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'mycloudstore') };
  }
  if (/explore\s+(?:the\s+)?globe|globe/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'explore-the-globe') };
  }
  if (/toolock/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'toolock') };
  }
  if (/resuvana|resume\s+builder/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'resuvana') };
  }
  if (/cookpro|recipe/i.test(lastText)) {
    return { project: PORTFOLIO_KNOWLEDGE.projects.find(p => p.id === 'cookpro') };
  }

  if (/certif|credential/i.test(lastText)) {
    return { certifications: PORTFOLIO_KNOWLEDGE.certifications };
  }

  if (/academic|education|college|school|cvr/i.test(lastText)) {
    return { academicBackground: PORTFOLIO_KNOWLEDGE.academicBackground };
  }

  if (/lorven|founder|coo|ceo|cto/i.test(lastText)) {
    return { lorvenEnterprise: PORTFOLIO_KNOWLEDGE.lorvenEnterprise };
  }

  if (/toolkit|tools|tech\s+stack|skills/i.test(lastText)) {
    return { technicalToolkit: PORTFOLIO_KNOWLEDGE.technicalToolkit };
  }

  if (/projects?|what\s+has\s+he\s+built/i.test(lastText)) {
    return {
      projectsSummary: PORTFOLIO_KNOWLEDGE.projects.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        year: p.year,
        description: p.description,
        technologies: p.technologies,
        liveUrl: p.liveUrl
      }))
    };
  }

  return { profile: PORTFOLIO_KNOWLEDGE.profile };
}

/**
 * Main BOB Response Synthesizer
 * 
 * Strict Intent Hierarchy:
 *  1. Math / Calculation Explanation Request ("Why is 9 the answer?")
 *  2. Direct Math / Arithmetic Evaluation ("45 divided by 5", "2+2", "12 × 8")
 *  3. Casual Exit / Goodbyes ("ok bro i have some work to do", "bye", "see ya")
 *  4. Status / How Are You Greetings ("how are u broo", "whats up bob", "how r u")
 *  5. Visitor Mood / State Response ("im good", "i'm fine", "doing well")
 *  6. Compliments, Slang & Social Banter ("nicee", "brooo", "damn that's cool", "fr", "haha nice")
 *  7. Thanks & Polite Acknowledgments ("thanks bro", "thank you", "alright")
 *  8. Ambiguity & Clarifications ("Tell me about that." with no context, "what do you mean?")
 *  9. Casual Greetings ("hi bob", "hey bro", "hello")
 * 10. Multi-Turn Topic & Follow-Up Context ("explain it more" -> phishing/firewall deep dive; "what technologies does it use?")
 * 11. Explicit Identity / Capabilities ("who are you", "what can you do")
 * 12. Portfolio & Verified Projects (Jaya Vardhan, DoomChat, encryption in projects, academics, etc.)
 * 13. Cybersecurity Knowledge (phishing, malware, firewall, vpn, encryption, mfa, zero trust)
 * 14. Technology & Programming Knowledge (api, operating systems, linux, git, compilers, databases)
 * 15. General Science Knowledge (gravity, sky blue, who invented the internet)
 * 16. Natural Conversational Fallback (Statement-aware, friendly, zero pseudo-protocol hallucination)
 */
export function synthesizeBobResponse(messages) {
  if (!messages || messages.length === 0) {
    return "Hey! How can I help you today?";
  }

  const lastMessage = messages[messages.length - 1];
  const userText = (lastMessage.content || '').trim();
  const lower = userText.toLowerCase();
  const norm = normalizeCasualText(userText);
  const isBro = /\b(?:bro|broo|brooo|dude|man|mate|buddy)\b/i.test(userText);

  // Extract recent conversation history for pronoun, context, and follow-up resolution
  let prevContext = '';
  let prevAssistantMsg = '';
  let prevUserMsg = '';
  if (messages.length >= 2) {
    const historySlice = messages.slice(-6, -1);
    prevContext = historySlice.map(m => m.content || '').join(' ').toLowerCase();
    
    for (let i = messages.length - 2; i >= 0; i--) {
      if (!prevAssistantMsg && messages[i].role === 'assistant') {
        prevAssistantMsg = messages[i].content || '';
      }
      if (!prevUserMsg && messages[i].role === 'user') {
        prevUserMsg = messages[i].content || '';
      }
      if (prevAssistantMsg && prevUserMsg) break;
    }
  }

  // Extract active conversation topic from prior message turns
  const activeTopic = getActiveTopic(messages.length >= 2 ? messages.slice(0, -1) : []);

  // 0. First-Person Self-Identification ("hi im jaya vardhan myself", "myself jaya vardhan", "im only jaya vardhan", "hi im jaya", "it's me jaya")
  const selfIdAnswer = detectSelfIdentification(userText, norm, isBro);
  if (selfIdAnswer !== null) {
    return selfIdAnswer;
  }

  // 0.1 Lightweight Jaya Defense / Roast Mode (witty defense against obviously false, mocking, or baiting claims)
  const roastMatch = detectJayaDefenseRoastClaim(userText);
  if (roastMatch !== null) {
    return roastMatch.roast;
  }

  // 0.2 Safe Website Navigation Assistant (Section & Page Navigation)
  const navIntent = detectNavigationIntent(userText);
  if (navIntent !== null) {
    return `${navIntent.response} [NAV:${navIntent.action}]`;
  }

  // 1. Math Explanation Request ("Why is 9 the answer?", "Why 9?")
  const mathExplanation = explainMathCalculation(userText, messages);
  if (mathExplanation !== null) {
    return mathExplanation;
  }

  // 2. Direct Math / Arithmetic Evaluation ("45 divided by 5", "12 × 8", "100 - 37", "2+2")
  const mathAnswer = solveMathExpression(userText);
  if (mathAnswer !== null) {
    return mathAnswer;
  }

  // 3. Goodbye / Exit Intent ("ok bro i have some work to do", "bye", "gotta go", "good night")
  const goodbyeAnswer = detectGoodbye(userText, norm, isBro);
  if (goodbyeAnswer !== null) {
    return goodbyeAnswer;
  }

  // 4. Casual Status Query / How Are You ("how are u broo", "whats up bob", "how r u bro")
  const howAreYouAnswer = detectHowAreYou(userText, norm, isBro);
  if (howAreYouAnswer !== null) {
    return howAreYouAnswer;
  }

  // 5. Visitor Mood / State Response ("im good", "i'm fine", "doing well")
  const moodAnswer = detectUserMoodOrState(userText, norm, isBro);
  if (moodAnswer !== null) {
    return moodAnswer;
  }

  // 6. Compliments, Slang & Social Banter ("nicee", "brooo", "damn that's cool", "fr", "haha nice")
  const banterAnswer = detectComplimentOrBanter(userText, norm, isBro, messages);
  if (banterAnswer !== null) {
    return banterAnswer;
  }

  // 7. Thanks & Polite Acknowledgments ("thanks bro", "thank you", "alright", "got it")
  const thanksAnswer = detectThanksOrAck(userText, norm, isBro);
  if (thanksAnswer !== null) {
    return thanksAnswer;
  }

  // 8. Ambiguity & Clarification ("Tell me about that." with no context, "what do you mean?")
  const ambiguousAnswer = detectAmbiguous(userText, norm, prevContext, messages);
  if (ambiguousAnswer !== null) {
    return ambiguousAnswer;
  }

  // 9. Casual Greetings ("hi bob", "hey bro", "hello", "hey")
  const greetingAnswer = detectGreeting(userText, norm, isBro);
  if (greetingAnswer !== null) {
    return greetingAnswer;
  }

  // 10. Recommendations & General Leisure Questions (K-Dramas, Movies, Food, Books)
  // Handles both new recommendation queries and follow-up requests ("do it", "give me more", "which one is best?")
  const recommendationAnswer = handleRecommendations(userText, lower, norm, activeTopic, messages);
  if (recommendationAnswer !== null) {
    return recommendationAnswer;
  }

  // 11. Multi-Turn Topic & Follow-Up Context ("explain it more", "how does it work", "why did he build it")
  const topicFollowUp = resolveTopicFollowUp(userText, lower, norm, prevContext, messages);
  if (topicFollowUp !== null) {
    return topicFollowUp;
  }

  // 12. Explicit Identity / Capabilities Inquiry (ONLY when asked)
  if (/^(?:who\s+are\s+you|what\s+is\s+your\s+name)\??$/i.test(norm)) {
    return "I'm BOB, your AI assistant here 🤖😄";
  }

  if (/^(?:who\s+made\s+you|who\s+built\s+you|who\s+created\s+you|who\s+created\s+u)\??$/i.test(norm)) {
    return "I was created by Billakanti Jaya Vardhan as the AI assistant for his personal website. 😄";
  }

  if (/^(?:what\s+can\s+you\s+do|what\s+do\s+you\s+do|how\s+can\s+you\s+help|what\s+are\s+your\s+capabilities)\??$/i.test(norm)) {
    return "I can answer questions about Jaya Vardhan's background, projects, cybersecurity work, technology, and education, or help with general questions and everyday conversation!";
  }

  // 13. Portfolio, Projects, Academics & Follow-Up Questions (including "Which of Jaya's projects uses encryption?")
  const portfolioAnswer = handlePortfolioQuery(userText, lower, prevContext, messages);
  if (portfolioAnswer !== null) {
    return portfolioAnswer;
  }

  // 14. Cybersecurity Knowledge Questions (short & clear: phishing, malware, firewall, vpn, encryption, etc.)
  const cyberAnswer = handleCybersecurityQuery(userText, lower, norm);
  if (cyberAnswer !== null) {
    return cyberAnswer;
  }

  // 15. Technology & Programming Questions (api, dns, operating system, linux, git, docker, compilers)
  const techAnswer = handleTechAndProgrammingQuery(userText, lower, norm);
  if (techAnswer !== null) {
    return techAnswer;
  }

  // 16. General Science Questions (gravity, sky blue, who invented the internet, speed of light)
  const scienceAnswer = handleGeneralScienceQuery(userText, lower, norm);
  if (scienceAnswer !== null) {
    return scienceAnswer;
  }

  // 17. Natural Conversational Fallback — NO pseudo-protocols, NO fake software templates, NO forced portfolio pitch!
  const isQuestion = /\?$/.test(userText) || /^(?:what|how|why|when|where|who|can\s+you|could\s+you|is\s+there|are\s+there)\b/i.test(norm);
  const isImperativeOrAction = /^(?:suggest|recommend|tell\s+me|show\s+me|give\s+me|list|explain|calculate|compute|solve|do\s+it)\b/i.test(norm);

  if (!isQuestion && !isImperativeOrAction) {
    if (norm.length < 30) {
      return isBro ? "Got it bro! 😄" : "Got it! 😄";
    }
    return "Makes sense! Let me know if there's anything you'd like to chat about or explore.";
  }

  return "I don't have a direct answer for that right now, but feel free to ask about tech concepts, projects, or explore the portfolio!";
}

// Backwards compatibility alias
export const synthesizeNodeResponse = synthesizeBobResponse;

/**
 * Fast Path Deterministic Evaluator
 * Resolves simple arithmetic, greetings, status queries, acknowledgments, and goodbyes
 * instantly (< 1ms) without dispatching a network call to Gemini.
 */
export function getFastPathResponse(messages) {
  if (!messages || messages.length === 0) return null;

  const lastMessage = messages[messages.length - 1];
  const userText = (lastMessage.content || '').trim();
  if (!userText) return null;

  const norm = normalizeCasualText(userText);
  const isBro = /\b(?:bro|broo|brooo|dude|man|mate|buddy)\b/i.test(userText);

  // 0. First-Person Self-Identification ("hi im jaya vardhan myself", "myself jaya vardhan", "im only jaya vardhan", "hi im jaya", "it's me jaya")
  const selfIdAnswer = detectSelfIdentification(userText, norm, isBro);
  if (selfIdAnswer !== null) return selfIdAnswer;

  // 0.5 Verified Personal Links (Instagram, LinkedIn, GitHub, Email, Website, Socials)
  // Authoritative portfolio grounding: Zero hallucination, instantaneous (< 1ms), exact verified canonical links
  const lower = userText.toLowerCase();
  const personalLinkAnswer = detectVerifiedPersonalLink(userText, norm, lower);
  if (personalLinkAnswer !== null) return personalLinkAnswer;

  // 0.6 Safe Website Navigation Assistant (Section & Page Navigation)
  const navIntent = detectNavigationIntent(userText);
  if (navIntent !== null) {
    return `${navIntent.response} [NAV:${navIntent.action}]`;
  }

  // 1. Math Explanation Request ("Why is 9 the answer?")
  const mathExplanation = explainMathCalculation(userText, messages);
  if (mathExplanation !== null) return mathExplanation;

  // 2. Direct Math / Arithmetic Evaluation ("2+2", "145 * 7", "45 divided by 5")
  const mathAnswer = solveMathExpression(userText);
  if (mathAnswer !== null) return mathAnswer;

  // 3. Goodbye / Exit Intent ("bye", "see ya", "gotta go")
  const goodbyeAnswer = detectGoodbye(userText, norm, isBro);
  if (goodbyeAnswer !== null) return goodbyeAnswer;

  // 4. Casual Status Query / How Are You ("how are you", "how are u bro", "whats up")
  const howAreYouAnswer = detectHowAreYou(userText, norm, isBro);
  if (howAreYouAnswer !== null) return howAreYouAnswer;

  // 5. Visitor Mood / State Response ("im good", "doing well")
  const moodAnswer = detectUserMoodOrState(userText, norm, isBro);
  if (moodAnswer !== null) return moodAnswer;

  // 6. Identity Inquiry ("who are you?", "what is your name")
  if (/^(?:who\s+are\s+you|what\s+is\s+your\s+name)\??$/i.test(norm)) {
    return "I'm BOB, your AI assistant here 🤖😄";
  }

  // 7. Compliments, Slang & Social Banter ("nicee", "brooo", "damn that's cool", "nothing")
  const banterAnswer = detectComplimentOrBanter(userText, norm, isBro, messages);
  if (banterAnswer !== null) return banterAnswer;

  // 8. Thanks & Polite Acknowledgments ("thanks bro", "thank you", "alright", "got it")
  const thanksAnswer = detectThanksOrAck(userText, norm, isBro);
  if (thanksAnswer !== null) return thanksAnswer;

  // 9. Casual Greetings ("hi bob", "hey bro", "hello", "hi")
  const greetingAnswer = detectGreeting(userText, norm, isBro);
  if (greetingAnswer !== null) return greetingAnswer;

  return null;
}
