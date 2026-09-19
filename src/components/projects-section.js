/**
 * projects-section.js — Portfolio 2.0 Homepage
 * Renders 8 compact, individually separated project cards in a 3-column layout.
 * Each card is directly clickable and opens the project's live URL in a new browser tab.
 */

import { PROJECTS } from '../data/projects-data.js';

export class ProjectsSectionController {
  constructor() {
    this.section = document.getElementById('projects');
    if (!this.section) return;

    this.grid = this.section.querySelector('#projectsGrid');
    if (!this.grid) return;

    this.prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._render();
    this._initReveal();
  }

  /* ------------------------------------------------------------------
     RENDER — 8 compact separated cards
     ------------------------------------------------------------------ */

  _render() {
    const fragment = document.createDocumentFragment();
    PROJECTS.forEach((project) => fragment.appendChild(this._buildCard(project)));
    this.grid.appendChild(fragment);
  }

  _buildCard(project) {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = project.liveUrl;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('data-cursor-hover', 'true');
    card.setAttribute('data-number', project.number);
    card.setAttribute('data-slug', project.slug);
    card.setAttribute(
      'aria-label',
      `${project.title} — ${project.category}. Opens live project in a new tab.`
    );

    // Render exact concise description and 4–5 main technologies (no overflow count)
    const description = project.mainDescription || project.shortDescription;
    const techList = project.mainTech || project.tech.slice(0, 4);
    const techHTML = techList
      .map((t) => `<span class="card-tech-tag">${t}</span>`)
      .join('');

    card.innerHTML = `
      <div class="card-topbar">
        <span class="card-number">${project.number}</span>
        <span class="card-category">${project.category}</span>
      </div>

      <h3 class="card-title">${project.title}</h3>
      <p class="card-desc">${description}</p>

      <div class="card-tech-list" aria-label="Technologies used">${techHTML}</div>
    `;

    return card;
  }

  /* ------------------------------------------------------------------
     SCROLL REVEAL — subtle staggered reveal using opacity + translateY
     ------------------------------------------------------------------ */

  _initReveal() {
    const cards = Array.from(this.grid.querySelectorAll('.project-card'));

    if (this.prefersReducedMotion) {
      cards.forEach((c) => c.classList.add('is-revealed'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('is-revealed'));
      return;
    }

    let triggered = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered) {
            triggered = true;
            cards.forEach((card, i) => {
              setTimeout(() => card.classList.add('is-revealed'), i * 60);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(this.section);
  }
}

