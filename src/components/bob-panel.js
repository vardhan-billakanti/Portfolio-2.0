/**
 * BOB Assistant Controller
 * In-place overlay side panel for Billakanti Jaya Vardhan's personal website.
 * Handles UI creation, streaming SSE chat, conversation state,
 * safe website navigation, keyboard accessibility, and dual cursor interactions.
 */

import { SAFE_NAV_MAP, detectNavigationIntent } from '../data/bob-navigation.js';

export class BobAssistantController {
  constructor() {
    this.isOpen = false;
    this.isGenerating = false;
    this.messages = [];
    this.activeTrigger = null;
    this.savedScrollY = 0;
    this.currentAbortController = null;

    this.backdrop = null;
    this.panel = null;
    this.conversation = null;
    this.textarea = null;
    this.sendBtn = null;
    this.resetBtn = null;
    this.closeBtn = null;

    this.initDOM();
  }

  initDOM() {
    if (document.getElementById('bob-panel') || document.getElementById('node-panel')) {
      return;
    }

    // 1. Create Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.id = 'bob-backdrop';
    this.backdrop.className = 'bob-backdrop node-backdrop';
    this.backdrop.setAttribute('aria-hidden', 'true');
    this.backdrop.setAttribute('data-cursor-hover', 'true');

    // 2. Create Main Panel
    this.panel = document.createElement('aside');
    this.panel.id = 'bob-panel';
    this.panel.className = 'bob-panel node-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', 'BOB Intelligent Portfolio Assistant');

    this.panel.innerHTML = `
      <header class="bob-header node-header">
        <div class="bob-brand-group node-brand-group">
          <span class="bob-brand-title node-brand-title">BOB</span>
          <div class="bob-status-indicator node-status-indicator" aria-label="System status active">
            <span class="bob-status-dot node-status-dot"></span>
            <span class="bob-status-label node-status-label">ONLINE</span>
          </div>
        </div>
        <div class="bob-actions node-actions">
          <button id="bob-reset-btn" class="bob-control-btn node-control-btn" aria-label="New conversation" data-cursor-hover="true" title="New conversation">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Reset</span>
          </button>
          <button id="bob-close-btn" class="bob-control-btn node-control-btn bob-close-btn node-close-btn" aria-label="Close assistant" data-cursor-hover="true" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <div id="bob-conversation" class="bob-conversation node-conversation" role="log" aria-live="polite">
        <!-- Initial Welcome Presentation -->
        <div class="bob-welcome-card node-welcome-card" id="bob-welcome-card">
          <span class="bob-welcome-tag node-welcome-tag">AI ASSISTANT</span>
          <h2 class="bob-welcome-title node-welcome-title">Ask BOB anything</h2>
          <p class="bob-welcome-desc node-welcome-desc">
            Ask about Jaya Vardhan, his projects, cybersecurity work, technology, education, or just have a conversation.
          </p>

          <div class="bob-chips-grid node-chips-grid">
            <button class="bob-chip node-chip" data-query="Who is Jaya Vardhan?" data-cursor-hover="true">Who is Jaya Vardhan?</button>
            <button class="bob-chip node-chip" data-query="What projects has he built?" data-cursor-hover="true">What projects has he built?</button>
            <button class="bob-chip node-chip" data-query="Cybersecurity work" data-cursor-hover="true">Cybersecurity work</button>
            <button class="bob-chip node-chip" data-query="Lorven Enterprise" data-cursor-hover="true">Lorven Enterprise</button>
            <button class="bob-chip node-chip" data-query="Explain DoomChat" data-cursor-hover="true">Explain DoomChat</button>
            <button class="bob-chip node-chip" data-query="Tell me about CookPro" data-cursor-hover="true">Tell me about CookPro</button>
            <button class="bob-chip node-chip" data-query="What cybersecurity projects has he built?" data-cursor-hover="true">What cybersecurity projects has he built?</button>
            <button class="bob-chip node-chip" data-query="Tell me about his certifications" data-cursor-hover="true">Tell me about his certifications</button>
          </div>
        </div>
      </div>

      <div class="bob-input-wrapper node-input-wrapper">
        <div class="bob-input-box node-input-box">
          <textarea 
            id="bob-textarea" 
            class="bob-textarea node-textarea" 
            rows="1" 
            maxlength="1000"
            placeholder="Ask BOB anything..."
            aria-label="Ask BOB assistant"
          ></textarea>
          <button id="bob-send-btn" class="bob-send-btn node-send-btn" aria-label="Send query" disabled data-cursor-hover="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="bob-footer-caption node-footer-caption">BOB synthesizes verified portfolio knowledge &amp; general reasoning</div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.panel);

    // Cache elements
    this.conversation = document.getElementById('bob-conversation');
    this.textarea = document.getElementById('bob-textarea');
    this.sendBtn = document.getElementById('bob-send-btn');
    this.resetBtn = document.getElementById('bob-reset-btn');
    this.closeBtn = document.getElementById('bob-close-btn');

    this.bindEvents();
  }

  bindEvents() {
    // Backdrop click closes
    this.backdrop.addEventListener('click', () => this.close());

    // Close button
    this.closeBtn.addEventListener('click', () => this.close());

    // Reset button
    this.resetBtn.addEventListener('click', () => this.resetConversation());

    // Textarea input auto-grow and button state
    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
      const hasText = this.textarea.value.trim().length > 0;
      this.sendBtn.disabled = !hasText || this.isGenerating;
      this.sendBtn.classList.toggle('active', hasText && !this.isGenerating);
    });

    // Enter to submit (Shift+Enter for newline)
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!this.sendBtn.disabled && !this.isGenerating) {
          this.sendMessage();
        }
      }
    });

    // Send button click
    this.sendBtn.addEventListener('click', () => {
      if (!this.isGenerating && this.textarea.value.trim().length > 0) {
        this.sendMessage();
      }
    });

    // Suggested query chips
    this.panel.addEventListener('click', (e) => {
      const chip = e.target.closest('.bob-chip, .node-chip');
      if (chip && !this.isGenerating) {
        const query = chip.getAttribute('data-query');
        if (query) {
          this.sendMessage(query);
        }
      }
    });

    // Escape key closes panel
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(triggerElement = null) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.activeTrigger = triggerElement;

    // Save and freeze body scroll without shifting position
    this.savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollY}px`;
    document.body.style.width = '100%';

    this.backdrop.classList.add('active');
    this.panel.classList.add('open');

    // Accessibility focus
    setTimeout(() => {
      if (this.textarea) {
        this.textarea.focus();
      }
    }, 280);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Abort any ongoing stream
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.isGenerating = false;

    this.backdrop.classList.remove('active');
    this.panel.classList.remove('open');

    // Restore body scroll exactly where it was
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, this.savedScrollY);

    // Return focus to the trigger
    if (this.activeTrigger && typeof this.activeTrigger.focus === 'function') {
      this.activeTrigger.focus();
    }
  }

  /**
   * Safely executes a verified navigation action from SAFE_NAV_MAP.
   * Auto-closes the BOB side panel so the destination is fully visible.
   * @param {string} actionKey - Whitelisted key from SAFE_NAV_MAP
   */
  executeSafeNavigation(actionKey) {
    const navConfig = SAFE_NAV_MAP[actionKey];
    if (!navConfig) {
      console.warn('[BOB Navigation] Unauthorized navigation action:', actionKey);
      return;
    }

    const isProjectsPage = window.location.pathname.endsWith('projects.html') || window.location.pathname.endsWith('/projects');

    // Natural reading cadence (320ms): allow user to view confirmation before BOB smoothly glides away
    setTimeout(() => {
      if (navConfig.type === 'page') {
        // DEDICATED PROJECTS PAGE NAVIGATION
        this.close();

        if (!isProjectsPage) {
          setTimeout(() => {
            window.location.href = navConfig.url;
          }, 100);
        } else {
          // Already on dedicated projects page: smooth scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (navConfig.type === 'section') {
        const targetId = navConfig.id;

        if (isProjectsPage) {
          // If on dedicated projects page, redirect to homepage with hash anchor
          this.close();
          setTimeout(() => {
            window.location.href = `/#${targetId}`;
          }, 100);
          return;
        }

        // On homepage:
        // 1. Immediately begin smoothly closing the BOB side panel
        this.close();

        // 2. Start smooth scroll to target section without delay
        requestAnimationFrame(() => {
          this.smoothScrollToSection(targetId);
        });
      }
    }, 320);
  }

  /**
   * Smoothly scrolls to a homepage section accounting for the fixed navbar height
   * @param {string} targetId - Section ID without #
   */
  smoothScrollToSection(targetId) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const navHeight = 72;
    const elementPosition = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
    const offsetPosition = targetId === 'home' ? 0 : Math.max(0, elementPosition - navHeight);

    if (window.__portfolioNav && typeof window.__portfolioNav.scrollToTarget === 'function') {
      window.__portfolioNav.scrollToTarget(offsetPosition, targetId);
    } else {
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }

    if (history.pushState) {
      history.pushState(null, null, `#${targetId}`);
    }
  }

  resetConversation() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.isGenerating = false;
    this.messages = [];
    this.conversation.innerHTML = `
      <div class="bob-welcome-card node-welcome-card" id="bob-welcome-card">
        <span class="bob-welcome-tag node-welcome-tag">AI ASSISTANT</span>
        <h2 class="bob-welcome-title node-welcome-title">Ask BOB anything</h2>
        <p class="bob-welcome-desc node-welcome-desc">
          Ask about Jaya Vardhan, his projects, cybersecurity work, technology, education, or just have a conversation.
        </p>

        <div class="bob-chips-grid node-chips-grid">
          <button class="bob-chip node-chip" data-query="Who is Jaya Vardhan?" data-cursor-hover="true">Who is Jaya Vardhan?</button>
          <button class="bob-chip node-chip" data-query="What projects has he built?" data-cursor-hover="true">What projects has he built?</button>
          <button class="bob-chip node-chip" data-query="Cybersecurity work" data-cursor-hover="true">Cybersecurity work</button>
          <button class="bob-chip node-chip" data-query="Lorven Enterprise" data-cursor-hover="true">Lorven Enterprise</button>
          <button class="bob-chip node-chip" data-query="Explain DoomChat" data-cursor-hover="true">Explain DoomChat</button>
          <button class="bob-chip node-chip" data-query="Tell me about CookPro" data-cursor-hover="true">Tell me about CookPro</button>
          <button class="bob-chip node-chip" data-query="What cybersecurity projects has he built?" data-cursor-hover="true">What cybersecurity projects has he built?</button>
          <button class="bob-chip node-chip" data-query="Tell me about his certifications" data-cursor-hover="true">Tell me about his certifications</button>
        </div>
      </div>
    `;
    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    this.sendBtn.disabled = true;
    this.sendBtn.classList.remove('active');
  }

  async sendMessage(overrideText = null) {
    const rawText = (overrideText || this.textarea.value).trim();
    if (!rawText) return;
    const text = rawText.slice(0, 1000);

    // Abort any prior in-flight request so the newest message receives immediate priority
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    const abortController = new AbortController();
    this.currentAbortController = abortController;

    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    this.sendBtn.disabled = true;
    this.sendBtn.classList.remove('active');
    this.isGenerating = true;

    // 1. Append User Message
    this.appendUserMessage(text);
    this.messages.push({ role: 'user', content: text });

    // Enforce conversation context limit (keep last 8 turns for responsive, fast-tokenizing context)
    if (this.messages.length > 8) {
      this.messages = this.messages.slice(-8);
    }

    // 2. Append Stable Assistant Row with Typing Indicator
    const assistantRow = document.createElement('div');
    assistantRow.className = 'bob-msg-row node-msg-row bob-msg-assistant node-msg-assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'bob-assistant-content node-assistant-content';

    // Small typing indicator visible ONLY while waiting for the first chunk
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'bob-thinking-state node-thinking-state';

    let thinkingLabel = 'BOB thinking...';
    const lower = text.toLowerCase();
    if (
      (/\b(?:generate|create|render|paint|draw)\b/i.test(lower) && /\b(?:images?|pictures?|photos?|wallpapers?|illustrations?|artworks?|drawings?|graphics?|avatars?)\b/i.test(lower)) ||
      /^(?:please\s+)?(?:generate|create|render|draw|paint)\s+(?:me\s+)?(?:a|an|the|some)?\s+/i.test(lower) ||
      /^(?:please\s+)?make\s+(?:me\s+)?(?:a|an|the|some)?\s+.*(?:robot|avatar|wallpaper|illustration|artwork|poster|character|scene|city|landscape)/i.test(lower)
    ) {
      thinkingLabel = 'BOB generating image...';
    } else if (
      /\b(?:show|find|search|display|look\s*up|get)\b.*\b(?:images?|pictures?|photos?|pics?)\b/i.test(lower) ||
      /^(?:images?|pictures?|photos?|pics?)\s+(?:of|for|about)\b/i.test(lower) ||
      /^(?:more|show\s+(?:me\s+)?more|give\s+(?:me\s+)?more|next|load\s+more|more\s+trees|more\s+pictures|more\s+images)\b/i.test(lower)
    ) {
      thinkingLabel = 'BOB searching images...';
    }

    typingIndicator.innerHTML = `
      <span class="bob-thinking-dot node-thinking-dot"></span>
      <span>${thinkingLabel}</span>
    `;
    contentDiv.appendChild(typingIndicator);
    assistantRow.appendChild(contentDiv);
    this.conversation.appendChild(assistantRow);
    this.scrollToBottom(true);

    let fullAnswer = '';
    let renderedAnswer = '';
    let hasReceivedFirstToken = false;
    let textContainer = null;
    let inlineCursor = null;
    let rafId = null;

    // Client-side safety timeout to prevent stuck thinking state
    let isTimedOut = false;
    let clientTimeoutId = null;
    const CLIENT_TIMEOUT_MS = 25000;

    clientTimeoutId = setTimeout(() => {
      isTimedOut = true;
      console.warn('[BOB] Client request safety timeout triggered after 25s (bob-panel.js:sendMessage)');
      abortController.abort(new Error('BOB_CLIENT_TIMEOUT'));
    }, CLIENT_TIMEOUT_MS);

    // Batched, stable stream updater via requestAnimationFrame
    const renderStreamUpdate = (isFinal = false) => {
      if (!isFinal && fullAnswer === renderedAnswer) return;
      renderedAnswer = fullAnswer;

      // 9. First token arrived: instantly replace typing indicator with text flow
      if (!hasReceivedFirstToken && fullAnswer.length > 0) {
        hasReceivedFirstToken = true;
        if (clientTimeoutId) {
          clearTimeout(clientTimeoutId);
          clientTimeoutId = null;
        }
        contentDiv.innerHTML = '';

        textContainer = document.createElement('div');
        textContainer.className = 'bob-text-flow';
        contentDiv.appendChild(textContainer);

        inlineCursor = document.createElement('span');
        inlineCursor.className = 'bob-streaming-cursor';
        inlineCursor.setAttribute('aria-hidden', 'true');
        contentDiv.appendChild(inlineCursor);
      }

      if (textContainer) {
        const wasNearBottom = this.isNearBottom(80);
        const displayAnswer = fullAnswer.replace(/\[(?:Image Search|Found images for):?[^\]]*\]/gi, '').replace(/\[NAV:[A-Z_]+\]/g, '').trim();
        textContainer.innerHTML = isFinal ? this.renderMarkdown(displayAnswer) : this.renderStreamMarkdown(displayAnswer);

        if (isFinal && inlineCursor) {
          inlineCursor.remove();
          inlineCursor = null;
        }

        if (wasNearBottom) {
          this.conversation.scrollTop = this.conversation.scrollHeight;
        }
      }
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        renderStreamUpdate(false);
      });
    };

    try {
      const response = await fetch('/api/bob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.messages }),
        signal: abortController.signal
      }).catch((fetchErr) => {
        if (fetchErr.name === 'AbortError') {
          throw fetchErr;
        }
        // Fallback endpoint
        return fetch('/api/bob-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: this.messages }),
          signal: abortController.signal
        });
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isStructuredResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data: /, '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error && !parsed.type) {
                throw new Error(parsed.error);
              }

              // 1. FREE IMAGE SEARCH RESULTS
              if (parsed.type === 'image_search') {
                isStructuredResult = true;
                hasReceivedFirstToken = true;
                if (clientTimeoutId) {
                  clearTimeout(clientTimeoutId);
                  clientTimeoutId = null;
                }
                contentDiv.innerHTML = '';

                const searchContainer = document.createElement('div');
                searchContainer.className = 'bob-image-search-container';

                const queryHeader = document.createElement('div');
                queryHeader.className = 'bob-image-search-header';
                const escapedQuery = this.escapeHtml(parsed.query || 'images');

                if (!parsed.images || parsed.images.length === 0) {
                  queryHeader.innerHTML = `<span>No images found for "<em>${escapedQuery}</em>". Try a different search query.</span>`;
                  searchContainer.appendChild(queryHeader);
                } else {
                  const headingText = parsed.heading || (parsed.isFollowUp ? `Here are some more ${escapedQuery} images:` : `Here are some ${escapedQuery} images:`);
                  queryHeader.innerHTML = `<span>${this.escapeHtml(headingText)}</span>`;
                  searchContainer.appendChild(queryHeader);

                  const grid = document.createElement('div');
                  grid.className = 'bob-image-search-grid';

                  parsed.images.forEach(img => {
                    const item = document.createElement('a');
                    item.className = 'bob-image-search-item';
                    item.href = img.sourceUrl || img.url;
                    item.target = '_blank';
                    item.rel = 'noopener noreferrer';
                    item.title = `${img.title} (Opens Wikimedia source)`;
                    item.setAttribute('data-cursor-hover', 'true');

                    item.innerHTML = `
                      <div class="bob-image-thumb-wrap">
                        <img src="${img.url}" alt="${this.escapeHtml(img.title)}" loading="lazy" />
                      </div>
                      <span class="bob-image-search-caption">${this.escapeHtml(img.title)}</span>
                    `;
                    grid.appendChild(item);
                  });

                  searchContainer.appendChild(grid);
                }

                contentDiv.appendChild(searchContainer);
                const assistantHistoryText = parsed.isFollowUp
                  ? `Here are some more ${parsed.query} images.`
                  : `Here are some ${parsed.query} images.`;
                this.messages.push({ role: 'assistant', content: assistantHistoryText });
                this.lastImageSearchQuery = parsed.query;
                this.scrollToBottom(true);
                break;
              }

              // 2. EXPLICIT IMAGE GENERATION RESULT
              if (parsed.type === 'image_generation') {
                isStructuredResult = true;
                hasReceivedFirstToken = true;
                if (clientTimeoutId) {
                  clearTimeout(clientTimeoutId);
                  clientTimeoutId = null;
                }
                contentDiv.innerHTML = '';

                const genCard = document.createElement('div');
                genCard.className = 'bob-generated-image-card';

                const statusLine = document.createElement('div');
                statusLine.className = 'bob-gen-status-text';
                statusLine.textContent = 'Sure — generating it now.';
                genCard.appendChild(statusLine);

                const header = document.createElement('div');
                header.className = 'bob-generated-image-header';
                header.innerHTML = `
                  <span class="bob-image-badge">AI GENERATED</span>
                  <span class="bob-image-prompt">"${this.escapeHtml(parsed.prompt)}"</span>
                `;
                genCard.appendChild(header);

                const imgWrap = document.createElement('div');
                imgWrap.className = 'bob-generated-image-wrap';
                imgWrap.innerHTML = `
                  <img src="${parsed.imageData}" alt="${this.escapeHtml(parsed.prompt)}" class="bob-generated-img" />
                `;
                genCard.appendChild(imgWrap);

                const actions = document.createElement('div');
                actions.className = 'bob-generated-image-actions';

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'bob-download-image-btn';
                downloadBtn.type = 'button';
                downloadBtn.setAttribute('data-cursor-hover', 'true');
                downloadBtn.innerHTML = `
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download Image</span>
                `;

                downloadBtn.addEventListener('click', () => {
                  const link = document.createElement('a');
                  link.href = parsed.imageData;
                  link.download = 'bob-generated-image.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });

                actions.appendChild(downloadBtn);
                genCard.appendChild(actions);

                contentDiv.appendChild(genCard);
                this.messages.push({ role: 'assistant', content: `Here is the generated image for: "${parsed.prompt}".` });
                this.scrollToBottom(true);
                break;
              }

              // 3. EXPLICIT IMAGE GENERATION ERROR
              if (parsed.type === 'image_generation_error') {
                isStructuredResult = true;
                hasReceivedFirstToken = true;
                if (clientTimeoutId) {
                  clearTimeout(clientTimeoutId);
                  clientTimeoutId = null;
                }
                contentDiv.innerHTML = '';

                // Log real technical error in console in development
                console.error('[BOB Image Generation Backend Error]:', parsed.errorDetails || parsed.error);

                const errorContainer = document.createElement('div');
                errorContainer.className = 'bob-image-error-container';

                const statusLine = document.createElement('div');
                statusLine.className = 'bob-gen-status-text';
                statusLine.textContent = 'Sure — generating it now.';
                errorContainer.appendChild(statusLine);

                const errNotice = document.createElement('div');
                errNotice.className = 'bob-image-gen-error';
                errNotice.textContent = parsed.error || "I couldn't generate that image right now. Please try again.";
                errorContainer.appendChild(errNotice);

                contentDiv.appendChild(errorContainer);
                this.messages.push({ role: 'assistant', content: parsed.error || "I couldn't generate that image right now. Please try again." });
                this.scrollToBottom(true);
                break;
              }

              // 4. NORMAL TEXT CHUNK
              if (parsed.chunk) {
                fullAnswer += parsed.chunk;
                if (!hasReceivedFirstToken) {
                  renderStreamUpdate(false);
                } else {
                  scheduleUpdate();
                }
              }
            } catch (e) {
              if (dataStr.includes('"error"')) {
                throw e;
              }
            }
          }
        }
      }

      // Stream complete
      if (clientTimeoutId) {
        clearTimeout(clientTimeoutId);
        clientTimeoutId = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!isStructuredResult) {
        renderStreamUpdate(true);
        if (fullAnswer.trim()) {
          this.messages.push({ role: 'assistant', content: fullAnswer });
        }
      }

      // Safe Website Navigation Evaluation
      let detectedAction = null;
      const navMatch = fullAnswer.match(/\[NAV:([A-Z_]+)\]/);
      if (navMatch && SAFE_NAV_MAP[navMatch[1]]) {
        detectedAction = navMatch[1];
      } else {
        // Robust intent fallback: verify if user message was an unambiguous navigation request
        const intent = detectNavigationIntent(text);
        if (intent && SAFE_NAV_MAP[intent.action]) {
          detectedAction = intent.action;
        }
      }

      if (detectedAction) {
        this.executeSafeNavigation(detectedAction);
      }

    } catch (err) {
      if (err.name === 'AbortError' && !isTimedOut) {
        // Normal cancellation from a newer message or close; do not show error
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (!hasReceivedFirstToken && assistantRow.parentNode) {
          assistantRow.remove();
        }
        return;
      }

      console.error('[BOB UI Error]', isTimedOut ? 'Request timed out after 25s' : err);
      contentDiv.innerHTML = `
        <div class="bob-error-banner node-error-banner">
          <span>Sorry bro, I couldn't reach BOB right now. Try again.</span>
          <button class="bob-retry-btn node-retry-btn" data-cursor-hover="true">Retry</button>
        </div>
      `;
      const retryBtn = contentDiv.querySelector('.bob-retry-btn, .node-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          assistantRow.remove();
          this.sendMessage(text);
        });
      }
    } finally {
      if (clientTimeoutId) {
        clearTimeout(clientTimeoutId);
        clientTimeoutId = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (this.currentAbortController === abortController) {
        this.currentAbortController = null;
        this.isGenerating = false;
        if (this.sendBtn) {
          const hasText = this.textarea ? this.textarea.value.trim().length > 0 : false;
          this.sendBtn.disabled = !hasText;
          this.sendBtn.classList.toggle('active', hasText);
        }
        if (this.textarea) this.textarea.focus();
        this.scrollToBottom();
      }
    }
  }

  appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'bob-msg-row node-msg-row bob-msg-user node-msg-user';
    row.innerHTML = `
      <div class="bob-user-bubble node-user-bubble">${this.escapeHtml(text)}</div>
    `;
    this.conversation.appendChild(row);

    this.scrollToBottom(true);
  }

  isNearBottom(threshold = 90) {
    if (!this.conversation) return true;
    const { scrollHeight, scrollTop, clientHeight } = this.conversation;
    return (scrollHeight - scrollTop - clientHeight) <= threshold;
  }

  scrollToBottom(force = false) {
    if (!this.conversation) return;
    if (force || this.isNearBottom()) {
      this.conversation.scrollTop = this.conversation.scrollHeight;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  sanitizeUrl(rawUrl) {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim().replace(/^<|>$/g, '');
    // Allow only http, https, and mailto schemes
    if (/^https?:\/\/[a-zA-Z0-9\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=%]+$/i.test(trimmed)) {
      return trimmed;
    }
    if (/^mailto:[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  /**
   * Lightweight incremental markdown renderer for active streaming chunks.
   * Defers expensive regex and token replaces until complex tokens or final render.
   */
  renderStreamMarkdown(md) {
    if (!md) return '';
    const clean = md.replace(/\[(?:Image Search|Found images for):?[^\]]*\]/gi, '').replace(/\[NAV:[A-Z_]+\]/g, '').trim();
    // If text contains complex markdown indicators, fall back to complete parser
    if (clean.includes('`') || clean.includes('[') || clean.includes('http') || clean.includes('#') || clean.includes('*') || clean.includes('- ') || clean.includes('\n')) {
      return this.renderMarkdown(clean);
    }
    // Fast path: pure text without markdown overhead
    return `<p>${this.escapeHtml(clean)}</p>`;
  }

  renderMarkdown(md) {
    if (!md) return '';
    let html = md.replace(/\[(?:Image Search|Found images for):?[^\]]*\]/gi, '').replace(/\[NAV:[A-Z_]+\]/g, '').trim();

    // Stabilize unclosed code blocks during active streaming
    const codeBlockCount = (html.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      html += '\n```';
    }

    const tokens = [];
    const saveToken = (content) => {
      const placeholder = `%%BOB_TOKEN_${tokens.length}%%`;
      tokens.push(content);
      return placeholder;
    };

    // 1. Preserve Code Blocks
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return saveToken(`<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
    });

    // 2. Preserve Inline Code
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return saveToken(`<code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`);
    });

    // 3. Process Markdown Links: [label](url) with XSS escaping
    html = html.replace(/\[([^\]]+)\]\((<https?:\/\/[^\s>]+>|https?:\/\/[^\s\)]+|mailto:[^\s\)]+|[^\s\)]+)\)/g, (match, label, rawUrl) => {
      const cleanUrl = rawUrl.trim().replace(/^<|>$/g, '');
      const safeUrl = this.sanitizeUrl(cleanUrl);
      const safeLabel = this.escapeHtml(label);
      if (safeUrl) {
        return saveToken(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="bob-link node-link" data-cursor-hover="true">${safeLabel} ↗</a>`);
      }
      // Reject unsafe protocols completely
      if (/^(?:javascript|data|vbscript):/i.test(cleanUrl)) {
        return safeLabel;
      }
      return `${safeLabel} (${this.escapeHtml(cleanUrl)})`;
    });

    // 4. Auto-detect RAW URLs: https://... or http://...
    html = html.replace(/\b(https?:\/\/[^\s<>"'{}|\\^`]+)/gi, (match, rawUrl) => {
      // Strip trailing sentence punctuation
      let cleanUrl = rawUrl;
      let trailing = '';
      while (cleanUrl.length > 0 && /[.,!?;:)*_~>]$/.test(cleanUrl)) {
        if (cleanUrl.endsWith(')')) {
          const openCount = (cleanUrl.match(/\(/g) || []).length;
          const closeCount = (cleanUrl.match(/\)/g) || []).length;
          if (openCount >= closeCount) {
            break;
          }
        }
        trailing = cleanUrl.slice(-1) + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      }

      const safeUrl = this.sanitizeUrl(cleanUrl);
      if (safeUrl) {
        return saveToken(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="bob-link node-link" data-cursor-hover="true">${cleanUrl} ↗</a>`) + trailing;
      }
      return match;
    });

    // 5. Strip any raw/unsafe HTML tags to prevent raw HTML exposure and XSS
    html = html.replace(/<[^>]*>/g, '');

    // 6. Headings
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');

    // 6. Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 7. Unordered Lists (- item or * item)
    html = html.replace(/^\s*[-\*]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>(\n|(?=<li>)))/g, '<ul>$1</ul>');

    // 8. Numbered Lists (1. item)
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');

    // 9. Paragraphs
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') || trimmed.startsWith('<pre')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // 10. Restore all tokens
    for (let i = tokens.length - 1; i >= 0; i--) {
      html = html.replaceAll(`%%BOB_TOKEN_${i}%%`, tokens[i]);
    }

    return html;
  }
}

// Export singleton instance getter
let instance = null;
export function getBobAssistant() {
  if (!instance) {
    instance = new BobAssistantController();
  }
  return instance;
}

// Backwards compatibility alias
export const getNodeAssistant = getBobAssistant;
