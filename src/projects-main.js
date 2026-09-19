/**
 * projects-main.js — Portfolio 2.0 Dedicated Projects Page
 * Renders 8 detailed showcase cards with original project preview images,
 * category filters, and direct live links opening in a new tab.
 */

import { PROJECTS } from './data/projects-data.js';

// Category mapping for functional filters
const PROJECT_FILTER_MAP = {
  portfolio: ['web-cloud'],
  vaultix: ['web-cloud', 'security-privacy'],
  mycloudstore: ['web-cloud'],
  'explore-the-globe': ['interactive'],
  doomchat: ['web-cloud', 'security-privacy'],
  toolock: ['web-cloud', 'interactive'],
  resuvana: ['web-cloud', 'interactive'],
  cookpro: ['web-cloud'],
};

class ProjectsPageController {
  constructor() {
    this.grid = document.getElementById('pjGrid');
    if (!this.grid) return;

    this.filterBtns = document.querySelectorAll('.pj-filter-btn');
    this.currentFilter = 'all';

    this.prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._render();
    this._initFilters();
    this._initScrollReveal();
  }

  /* ------------------------------------------------------------------
     RENDER — Build showcase cards for all 8 projects
     ------------------------------------------------------------------ */

  _render() {
    const fragment = document.createDocumentFragment();

    PROJECTS.forEach((project) => {
      fragment.appendChild(this._buildCard(project));
    });

    this.grid.appendChild(fragment);
  }

  _buildCard(project) {
    const card = document.createElement('a');
    card.className = 'pj-card';
    card.href = project.liveUrl;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('data-slug', project.slug);
    card.setAttribute('data-categories', (PROJECT_FILTER_MAP[project.slug] || []).join(' '));
    card.setAttribute(
      'aria-label',
      `${project.title} — ${project.category} (${project.year}). Opens live project website in a new tab.`
    );

    // Complete technology stack pills (all technologies rendered directly, no overflow count)
    const techHTML = project.tech
      .map((t) => `<span class="pj-card-tech-tag">${t}</span>`)
      .join('');

    card.innerHTML = `
      <!-- Project Preview Image -->
      <div class="pj-card-media">
        <img
          class="pj-card-img"
          src="${project.image}"
          alt="${project.title} — ${project.category} Preview"
          loading="lazy"
          decoding="async"
          width="640"
          height="360"
        >
        <div class="pj-card-img-overlay" aria-hidden="true"></div>
      </div>

      <!-- Card Content -->
      <div class="pj-card-body">
        <!-- Top Meta: Category & Year -->
        <div class="pj-card-header">
          <span class="pj-card-category">${project.category}</span>
          <span class="pj-card-year">${project.year}</span>
        </div>

        <!-- Project Name -->
        <h2 class="pj-card-title">${project.title}</h2>

        <!-- Rich Project Description -->
        <p class="pj-card-desc">${project.shortDescription}</p>

        <!-- Technology Stack Pills -->
        <div class="pj-card-tech" aria-label="Technologies used">
          ${techHTML}
        </div>

        <!-- Bottom Interactive Editorial CTA -->
        <div class="pj-card-cta">
          <span class="pj-card-cta-link">
            <span class="pj-card-cta-label">Visit Live Project</span>
            <span class="pj-card-cta-line" aria-hidden="true"></span>
          </span>
          <span class="pj-card-cta-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    `;

    return card;
  }

  /* ------------------------------------------------------------------
     FILTERS — Functional category switching
     ------------------------------------------------------------------ */

  _initFilters() {
    if (!this.filterBtns.length) return;

    this.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        if (filter === this.currentFilter) return;

        this.currentFilter = filter;

        // Update button states
        this.filterBtns.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        // Filter cards
        const cards = this.grid.querySelectorAll('.pj-card');
        cards.forEach((card) => {
          const categories = card.getAttribute('data-categories') || '';
          const isMatch = filter === 'all' || categories.split(' ').includes(filter);

          if (isMatch) {
            card.classList.remove('is-hidden');
            requestAnimationFrame(() => {
              card.classList.add('is-revealed');
            });
          } else {
            card.classList.add('is-hidden');
            card.classList.remove('is-revealed');
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     SCROLL REVEAL — Subtle staggered card entrance
     ------------------------------------------------------------------ */

  _initScrollReveal() {
    const cards = Array.from(this.grid.querySelectorAll('.pj-card'));

    if (this.prefersReducedMotion || !('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    cards.forEach((card, idx) => {
      card.style.transitionDelay = `${(idx % 2) * 80}ms`;
      observer.observe(card);
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new ProjectsPageController();

  // Lazy-load BOB AI Assistant on demand
  let bobAssistantInstance = null;
  let isLoadingBob = false;

  async function openBobAssistant(triggerElement) {
    if (!bobAssistantInstance && !isLoadingBob) {
      isLoadingBob = true;
      try {
        const { getBobAssistant } = await import('./components/bob-panel.js');
        bobAssistantInstance = getBobAssistant();
      } catch (err) {
        console.error('Failed to load BOB assistant:', err);
      } finally {
        isLoadingBob = false;
      }
    }

    if (bobAssistantInstance) {
      bobAssistantInstance.open(triggerElement);
    }
  }

  const floatingBobBtn = document.getElementById('bob-trigger-floating');
  if (floatingBobBtn) {
    floatingBobBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openBobAssistant(floatingBobBtn);
    });
  }
});
