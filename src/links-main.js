/**
 * links-main.js — /links route
 * Dynamic controller for personal hub & project directory.
 * Synchronized directly with centralized portfolio data sources.
 */

import { PROJECTS } from './data/projects-data.js';
import { PORTFOLIO_KNOWLEDGE } from './data/portfolio-knowledge.js';

document.addEventListener('DOMContentLoaded', () => {
  renderMyLinks();
  renderMyProjects();
});

/**
 * Renders the 3 canonical personal links
 */
function renderMyLinks() {
  const container = document.getElementById('myLinksList');
  if (!container) return;

  const links = [
    {
      id: 'portfolio',
      name: 'Portfolio',
      meta: 'vardhanbillakanti.in',
      url: PORTFOLIO_KNOWLEDGE.canonicalLinks.website,
      ariaLabel: 'Visit Official Portfolio Website (opens in a new tab)',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    },
    {
      id: 'github',
      name: 'GitHub',
      meta: '@vardhan-billakanti',
      url: PORTFOLIO_KNOWLEDGE.canonicalLinks.github,
      ariaLabel: 'Visit GitHub Profile (opens in a new tab)',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      meta: 'in/jaya-vardhan-billakanti',
      url: PORTFOLIO_KNOWLEDGE.canonicalLinks.linkedin,
      ariaLabel: 'Visit LinkedIn Profile (opens in a new tab)',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
    }
  ];

  container.innerHTML = links.map(link => `
    <a href="${link.url}" 
       target="_blank" 
       rel="noopener noreferrer" 
       class="link-button-card" 
       aria-label="${link.ariaLabel}">
      <div class="link-button-left">
        <div class="link-button-icon-wrap">
          ${link.icon}
        </div>
        <div class="link-button-text">
          <span class="link-button-name">${link.name}</span>
          <span class="link-button-meta">${link.meta}</span>
        </div>
      </div>
      <div class="link-button-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7"/>
          <polyline points="7 7 17 7 17 17"/>
        </svg>
      </div>
    </a>
  `).join('');
}

/**
 * Renders the exact 8 projects from projects-data.js
 */
function renderMyProjects() {
  const container = document.getElementById('myProjectsList');
  if (!container) return;

  const countBadge = document.getElementById('projectsCount');
  if (countBadge) {
    countBadge.textContent = `${PROJECTS.length} PROJECTS`;
  }

  container.innerHTML = PROJECTS.map((project, idx) => {
    const description = project.mainDescription || project.shortDescription;

    const liveBtn = project.liveUrl
      ? `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-action-btn live-btn" aria-label="Open ${project.title} live application in new tab">
           <span>Live Demo</span>
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <line x1="7" y1="17" x2="17" y2="7"/>
             <polyline points="7 7 17 7 17 17"/>
           </svg>
         </a>`
      : '';

    const githubBtn = project.githubUrl
      ? `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-action-btn github-btn" aria-label="Open ${project.title} source code on GitHub in new tab">
           <span>GitHub</span>
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
           </svg>
         </a>`
      : '';

    const delay = Math.min(idx * 40 + 200, 600);

    return `
      <article class="project-entry-card" style="animation-delay: ${delay}ms;">
        <div class="project-entry-topbar">
          <span class="project-entry-category">${project.category}</span>
          <span class="project-entry-index">${project.number || String(idx + 1).padStart(2, '0')}</span>
        </div>

        <h3 class="project-entry-title">${project.title}</h3>
        <p class="project-entry-desc">${description}</p>

        <div class="project-entry-actions">
          ${liveBtn}
          ${githubBtn}
        </div>
      </article>
    `;
  }).join('');
}
