/**
 * project-detail.js  — Portfolio 2.0
 * Hash-based SPA router + full case study detail view renderer.
 *
 * Routing:
 *   #projects/:slug  → opens full-screen overlay for that project
 *   Anything else    → closes the overlay
 *
 * The overlay is injected once into <body> and reused for all projects.
 * Dynamic <title> + meta tags are updated for light SEO on direct URLs.
 */

import { PROJECTS, getProjectBySlug, getNextProject } from '../data/projects-data.js';

/* Stored original page title to restore on back */
const PAGE_TITLE_DEFAULT = document.title;

export class ProjectDetailRouter {
  constructor() {
    // Build the singleton overlay container
    this.overlay = this._createOverlay();
    document.body.appendChild(this.overlay);

    this._escHandler = null;
    this._isOpen = false;

    // React to hash changes (browser navigation / back button)
    window.addEventListener('hashchange', () => this._handleHash());

    // React to programmatic open events from ProjectsSectionController
    window.addEventListener('portfolio:openProject', (e) => {
      const { slug } = e.detail;
      // Navigate by setting hash — hashchange will handle rendering
      window.location.hash = `projects/${slug}`;
    });

    // Handle deep-link on first page load
    this._handleHash();
  }

  /* ------------------------------------------------------------------
     CREATE OVERLAY SKELETON
     ------------------------------------------------------------------ */

  _createOverlay() {
    const el = document.createElement('div');
    el.id = 'project-detail-overlay';
    el.className = 'project-detail-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Project case study');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('tabindex', '-1');
    return el;
  }

  /* ------------------------------------------------------------------
     ROUTING
     ------------------------------------------------------------------ */

  _handleHash() {
    const hash = window.location.hash || '';
    const match = hash.match(/^#projects\/(.+)$/);

    if (match) {
      const slug = decodeURIComponent(match[1]);
      const project = getProjectBySlug(slug);
      if (project) {
        this._open(project);
        return;
      }
    }

    // No match — close if open
    if (this._isOpen) {
      this._close();
    }
  }

  /* ------------------------------------------------------------------
     OPEN
     ------------------------------------------------------------------ */

  _open(project) {
    // Populate content
    this.overlay.innerHTML = this._buildHTML(project);

    // Scroll to top
    this.overlay.scrollTop = 0;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Show overlay
    this.overlay.setAttribute('aria-hidden', 'false');
    this.overlay.classList.add('is-open');
    this._isOpen = true;

    // Update document title + meta for SEO / browser tab
    this._updateMeta(project);

    // Wire back button
    const backBtn = this.overlay.querySelector('#detailBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this._navigateBack());

    // Wire next-project card
    const nextCard = this.overlay.querySelector('#detailNextCard');
    if (nextCard) {
      nextCard.addEventListener('click', () => {
        const nextSlug = nextCard.getAttribute('data-next-slug');
        if (nextSlug) window.location.hash = `projects/${nextSlug}`;
      });
      nextCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          nextCard.click();
        }
      });
    }

    // Escape key to close
    this._escHandler = (e) => {
      if (e.key === 'Escape') this._navigateBack();
    };
    window.addEventListener('keydown', this._escHandler);

    // Stagger content blocks
    requestAnimationFrame(() => {
      // Trigger hero image scale-in
      const hero = this.overlay.querySelector('.detail-hero');
      if (hero) setTimeout(() => hero.classList.add('is-loaded'), 50);

      // Stagger text blocks
      const blocks = this.overlay.querySelectorAll('.detail-block');
      blocks.forEach((block, i) => {
        setTimeout(() => block.classList.add('is-visible'), 120 + i * 75);
      });
    });

    // Move focus inside overlay for accessibility
    this.overlay.focus();
  }

  /* ------------------------------------------------------------------
     CLOSE
     ------------------------------------------------------------------ */

  _close() {
    this.overlay.classList.remove('is-open');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this._isOpen = false;

    // Restore document title
    document.title = PAGE_TITLE_DEFAULT;
    this._restoreDefaultMeta();

    // Remove escape listener
    if (this._escHandler) {
      window.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }

    // Scroll #projects section into view
    setTimeout(() => {
      const section = document.getElementById('projects');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  _navigateBack() {
    // Pop hash — hashchange fires and triggers _close()
    history.back();
  }

  /* ------------------------------------------------------------------
     META TAG MANAGEMENT (lightweight SPA SEO)
     ------------------------------------------------------------------ */

  _updateMeta(project) {
    document.title = `${project.title} — ${project.category} | Billakanti Jaya Vardhan`;

    const setMeta = (attr, val, content) => {
      let el = document.querySelector(`meta[${attr}="${val}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
        el.setAttribute('data-dynamic', 'true');
      }
      el.setAttribute('content', content);
    };

    const desc = `${project.shortDescription} — A project by Billakanti Jaya Vardhan.`;
    const url = `https://vardhanbillakanti.in/#projects/${project.slug}`;
    const img = `https://vardhanbillakanti.in${project.image}`;

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', `${project.title} | Billakanti Jaya Vardhan`);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:type', 'article');
    setMeta('name', 'twitter:title', `${project.title} | Billakanti Jaya Vardhan`);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
  }

  _restoreDefaultMeta() {
    // Remove dynamically injected meta tags
    document.querySelectorAll('meta[data-dynamic="true"]').forEach((el) => el.remove());
  }

  /* ------------------------------------------------------------------
     HTML BUILDER — cinema-grade case study layout
     ------------------------------------------------------------------ */

  _buildHTML(project) {
    const next = getNextProject(project.slug);

    // Features list
    const featuresHTML = project.features
      .map(
        (f) => `
        <div class="detail-feature-item">
          <span class="detail-feature-dot" aria-hidden="true"></span>
          <p class="detail-feature-text">${f}</p>
        </div>`
      )
      .join('');

    // Full tech chips
    const techChipsHTML = project.tech
      .map((t) => `<span class="detail-tech-chip">${t}</span>`)
      .join('');

    // Technical details table rows
    const techDetailsHTML = Object.entries(project.technicalDetails)
      .map(
        ([key, val]) => `
        <tr>
          <td>${key}</td>
          <td>${val}</td>
        </tr>`
      )
      .join('');

    // Live project CTA
    const liveBtn = project.liveUrl
      ? `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer"
           class="detail-link-btn primary" aria-label="Visit live ${project.title} project">
           Visit Live Project
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
             <polyline points="15 3 21 3 21 9"/>
             <line x1="10" y1="14" x2="21" y2="3"/>
           </svg>
         </a>`
      : '';

    const githubBtn = project.githubUrl
      ? `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer"
           class="detail-link-btn secondary" aria-label="View ${project.title} source code">
           View Source
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
           </svg>
         </a>`
      : '';

    return `
      <!-- ── STICKY NAV ── -->
      <nav class="detail-sticky-nav" aria-label="Project navigation">
        <button id="detailBackBtn" class="detail-back-btn" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Works
        </button>
        <span class="detail-nav-crumb" aria-hidden="true">
          SELECTED WORKS / ${project.number}
        </span>
      </nav>

      <!-- ── HERO IMAGE ── -->
      <div class="detail-hero" role="img" aria-label="${project.title} project screenshot">
        <img
          class="detail-hero-img"
          src="${project.image}"
          alt="${project.title} — ${project.category}"
          loading="eager"
          decoding="async"
        >
        <div class="detail-hero-gradient" aria-hidden="true"></div>
        <div class="detail-hero-caption">
          <div class="detail-hero-eyebrow" aria-hidden="true">
            <span class="detail-hero-number">${project.number}</span>
            <span class="detail-hero-slash"></span>
            <span class="detail-hero-category">${project.category}</span>
          </div>
          <h1 class="detail-hero-title">${project.title}</h1>
        </div>
      </div>

      <!-- ── BODY ── -->
      <div class="detail-body">

        <!-- Metadata strip -->
        <div class="detail-meta-strip detail-block">
          <div class="detail-meta-cell">
            <span class="detail-meta-label">Project</span>
            <span class="detail-meta-value">${project.title}</span>
          </div>
          <div class="detail-meta-cell">
            <span class="detail-meta-label">Category</span>
            <span class="detail-meta-value">${project.category}</span>
          </div>
          <div class="detail-meta-cell">
            <span class="detail-meta-label">Year</span>
            <span class="detail-meta-value">${project.year}</span>
          </div>
        </div>

        <!-- Overview -->
        <div class="detail-block">
          <p class="detail-section-heading">Overview</p>
          <p class="detail-overview-text">${project.fullDescription}</p>
        </div>

        <!-- Key Features -->
        <div class="detail-block">
          <p class="detail-section-heading">Key Features</p>
          <div class="detail-features-grid">
            ${featuresHTML}
          </div>
        </div>

        <!-- Tech Stack -->
        <div class="detail-block">
          <p class="detail-section-heading">Tech Stack</p>
          <div class="detail-tech-wrap">${techChipsHTML}</div>
        </div>

        <!-- Technical Details -->
        <div class="detail-block">
          <p class="detail-section-heading">Technical Details</p>
          <table class="detail-tech-table" aria-label="Technical architecture breakdown">
            <tbody>${techDetailsHTML}</tbody>
          </table>
        </div>

        <!-- Links -->
        ${liveBtn || githubBtn
          ? `<div class="detail-block">
               <p class="detail-section-heading">Links</p>
               <div class="detail-links-row">${liveBtn}${githubBtn}</div>
             </div>`
          : ''}

        <!-- Next Project -->
        <div class="detail-block detail-next-project">
          <span class="detail-next-label">Next Project</span>
          <div
            class="detail-next-card"
            id="detailNextCard"
            role="button"
            tabindex="0"
            data-next-slug="${next.slug}"
            aria-label="Go to next project: ${next.title}"
          >
            <img
              class="detail-next-thumb"
              src="${next.image}"
              alt="${next.title}"
              loading="lazy"
              decoding="async"
            >
            <div class="detail-next-info">
              <span class="detail-next-num">${next.number}</span>
              <h3 class="detail-next-title">${next.title}</h3>
            </div>
            <svg class="detail-next-arrow" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="1.75"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

      </div><!-- /detail-body -->
    `;
  }
}
