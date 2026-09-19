/**
 * BOB Navigation Knowledge & Safe Action System — Portfolio 2.0
 * 
 * Provides:
 * 1. SAFE_NAV_MAP: Strict whitelist of permitted navigation destinations.
 *    Prevents arbitrary JS execution or unauthorized URL redirections.
 * 2. detectNavigationIntent: Natural language understanding engine for section and page navigation.
 *    Disambiguates between the homepage Projects section and the dedicated Projects page.
 */

export const SAFE_NAV_MAP = Object.freeze({
  HOME: {
    type: 'section',
    id: 'home',
    label: 'Home',
    response: 'Sure bro 😎 Taking you back to Home.'
  },
  ABOUT: {
    type: 'section',
    id: 'about',
    label: 'About',
    response: 'Sure bro 😎 Taking you to About.'
  },
  ACADEMICS: {
    type: 'section',
    id: 'academics',
    label: 'Academics',
    response: 'Sure bro 😎 Taking you to Academics.'
  },
  TOOLKIT: {
    type: 'section',
    id: 'toolkit',
    label: 'Toolkit',
    response: 'Sure bro 😎 Taking you to Toolkit.'
  },
  PROJECTS_SECTION: {
    type: 'section',
    id: 'projects',
    label: 'Projects',
    response: 'Sure bro 😎 Taking you to Projects.'
  },
  CERTIFICATIONS: {
    type: 'section',
    id: 'certifications',
    label: 'Certifications',
    response: 'Sure bro 😎 Taking you to Certifications.'
  },
  LORVEN: {
    type: 'section',
    id: 'lorven',
    label: 'Lorven Enterprise',
    response: 'Sure bro 😎 Taking you to Lorven Enterprise.'
  },
  FOUNDERS: {
    type: 'section',
    id: 'founders',
    label: 'Founders',
    response: 'Sure bro 😎 Taking you to Founders.'
  },
  GET_IN_TOUCH: {
    type: 'section',
    id: 'contact',
    label: 'Get In Touch',
    response: 'Sure bro 😎 Taking you to Get In Touch.'
  },
  PROJECTS_PAGE: {
    type: 'page',
    url: '/projects.html',
    label: 'Dedicated Projects Page',
    response: 'Sure bro 😎 Taking you to the full project showcase.'
  }
});

/**
 * Natural language intent classifier for safe portfolio navigation.
 * 
 * Rules:
 * - Ambiguous "projects" or "show projects" -> MAIN Projects section on homepage (PROJECTS_SECTION).
 * - Explicit "all projects", "full projects", "project showcase", "complete project list",
 *   "dedicated projects page" -> Dedicated Projects page (PROJECTS_PAGE).
 * - Non-navigation inquiries ("tell me about VAULTIX", "what is 2+2", "hi", "how are you") -> null.
 * 
 * @param {string} rawText
 * @returns {{ action: string, destination: string, response: string } | null}
 */
export function detectNavigationIntent(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();

  // Strip leading greetings, mentions, or assistant addresses ("Bob, open projects", "Hey Bob: take me to about")
  text = text.replace(/^(?:hey|hi|hello|yo)?\s*(?:bob|assistant)?\s*[,:]?\s*/i, '').trim();
  // Strip trailing conversational filler ("bro", "please", "plz", "now", punctuation)
  text = text.replace(/[,.]?\s*(?:bro|dude|buddy|please|plz|now)?\s*[.!?]*$/i, '').trim();

  const lower = text.toLowerCase();
  if (!lower) return null;

  // Guard 1: Specific named projects or technology deep dives are informational queries, NOT section navigation
  if (/\b(?:vaultix|doomchat|mycloudstore|cookpro|toolock|resuvana|bridgetwin|explore\s+the\s+globe)\b/i.test(lower)) {
    return null;
  }

  // Guard 2: Questions asking for definitions, explanations, or facts without navigation verbs
  // e.g. "what is your toolkit", "what are his certifications", "who is jaya", "tell me about his projects", "how does it work"
  const hasNavVerb = /\b(?:open|go(?:\s+to)?|take\s+me(?:\s+to)?|show(?:\s+me)?|scroll(?:\s+to)?|navigate(?:\s+to)?|head(?:\s+to)?|bring\s+me(?:\s+to)?|lead\s+me(?:\s+to)?|visit)\b/i.test(lower);
  const isInformationalQuery = /^(?:what(?:\s+is|\s+are|\s+does)?|tell\s+me\s+about|who\s+is|explain|how\s+does|can\s+you\s+explain|describe|list)\b/i.test(lower);

  if (isInformationalQuery && !hasNavVerb) {
    return null;
  }

  // 1. DEDICATED PROJECTS PAGE
  // Explicitly matches requests for: all projects, full projects page, project showcase, complete list, dedicated page
  const isDedicatedProjectsPage = 
    /\b(?:all\s+(?:my\s+)?projects?|full\s+projects?(?:\s+page)?|project(?:s)?\s+showcase|complete\s+projects?(?:\s+list|\s+showcase)?|dedicated\s+projects?(?:\s+page)?)\b/i.test(lower) ||
    (/\b(?:show|open|view|take\s+me\s+to|go\s+to)\b/i.test(lower) && /\b(?:all\s+projects|full\s+projects?|project\s+showcase|complete\s+project\s+list|dedicated\s+projects?)\b/i.test(lower));

  if (isDedicatedProjectsPage) {
    return {
      action: 'PROJECTS_PAGE',
      destination: 'dedicated Projects page',
      response: SAFE_NAV_MAP.PROJECTS_PAGE.response
    };
  }

  // 2. MAIN PROJECTS SECTION (Homepage)
  // "projects", "show projects", "open projects", "take me to my projects", "go to the projects section", "show me the projects section"
  // Ambiguous project requests default to PROJECTS_SECTION per requirement 3.
  const isProjectsSection =
    /^(?:my\s+)?projects?(?:\s+section)?$/i.test(lower) ||
    /^(?:show|open|go\s+to|take\s+me\s+to|scroll\s+to)\s+(?:my\s+)?projects?(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to|visit)\b.*\bprojects?(?:\s+section)?\b/i.test(lower);

  if (isProjectsSection) {
    return {
      action: 'PROJECTS_SECTION',
      destination: 'Projects section',
      response: SAFE_NAV_MAP.PROJECTS_SECTION.response
    };
  }

  // 3. HOME / HERO SECTION
  // "go home", "take me home", "home", "hero", "back to top", "scroll to top"
  const isHome =
    /^(?:home|hero|top)$/i.test(lower) ||
    /^(?:go|take\s+me|navigate|head|scroll|back)\s+(?:to\s+)?(?:home|hero|top|the\s+top)$/i.test(lower) ||
    /\b(?:go|take\s+me|back)\s+home\b/i.test(lower);

  if (isHome) {
    return {
      action: 'HOME',
      destination: 'Home section',
      response: SAFE_NAV_MAP.HOME.response
    };
  }

  // 4. ABOUT SECTION
  // "open about", "show about", "take me to about", "go to about", "about", "about me"
  const isAbout =
    /^(?:about|about\s+me)(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\babout(?:\s+me)?(?:\s+section)?\b/i.test(lower);

  if (isAbout) {
    return {
      action: 'ABOUT',
      destination: 'About section',
      response: SAFE_NAV_MAP.ABOUT.response
    };
  }

  // 5. ACADEMICS SECTION
  // "show academics", "open academics", "take me to academics", "go to academics", "academics"
  const isAcademics =
    /^(?:academics?|education)(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\b(?:academics?|education)\b/i.test(lower);

  if (isAcademics) {
    return {
      action: 'ACADEMICS',
      destination: 'Academics section',
      response: SAFE_NAV_MAP.ACADEMICS.response
    };
  }

  // 6. TOOLKIT SECTION
  // "open toolkit", "show toolkit", "take me to toolkit", "go to toolkit", "go to my toolkit", "toolkit"
  const isToolkit =
    /^(?:my\s+)?toolkit(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\b(?:toolkit|skills?\s+section)\b/i.test(lower);

  if (isToolkit) {
    return {
      action: 'TOOLKIT',
      destination: 'Toolkit section',
      response: SAFE_NAV_MAP.TOOLKIT.response
    };
  }

  // 7. CERTIFICATIONS SECTION
  // "show certifications", "open certifications", "take me to certifications", "go to certifications", "certifications", "certs"
  const isCertifications =
    /^(?:my\s+)?(?:certifications?|certs?|credentials?)(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\b(?:certifications?|certs?|credentials?)\b/i.test(lower);

  if (isCertifications) {
    return {
      action: 'CERTIFICATIONS',
      destination: 'Certifications section',
      response: SAFE_NAV_MAP.CERTIFICATIONS.response
    };
  }

  // 8. LORVEN ENTERPRISE SECTION
  // "open lorven", "show lorven", "take me to lorven", "go to lorven", "lorven"
  const isLorven =
    /^lorven(?:\s+enterprise)?(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\blorven(?:\s+enterprise)?\b/i.test(lower);

  if (isLorven) {
    return {
      action: 'LORVEN',
      destination: 'Lorven Enterprise section',
      response: SAFE_NAV_MAP.LORVEN.response
    };
  }

  // 9. FOUNDERS SECTION
  // "show founders", "open founders", "take me to founders", "go to founders", "founders"
  const isFounders =
    /^(?:the\s+)?founders?(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\bfounders?\b/i.test(lower);

  if (isFounders) {
    return {
      action: 'FOUNDERS',
      destination: 'Founders section',
      response: SAFE_NAV_MAP.FOUNDERS.response
    };
  }

  // 10. GET IN TOUCH / CONTACT SECTION
  // "take me to contact", "open contact", "go to contact", "contact", "take me to get in touch", "open get in touch"
  const isContact =
    /^(?:contact|get\s+in\s+touch)(?:\s+section)?$/i.test(lower) ||
    /\b(?:open|show|show\s+me|take\s+me\s+to|go\s+to|scroll\s+to|navigate\s+to|head\s+to)\b.*\b(?:contact|get\s+in\s+touch|reach\s+out)\b/i.test(lower);

  if (isContact) {
    return {
      action: 'GET_IN_TOUCH',
      destination: 'Get In Touch section',
      response: SAFE_NAV_MAP.GET_IN_TOUCH.response
    };
  }

  return null;
}
