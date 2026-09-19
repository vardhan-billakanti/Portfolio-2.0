/**
 * PORTFOLIO 2.0 — TOOLKIT EXPERIENCE CONTROLLER
 * Orchestrates the 2-column technical ecosystem:
 * - Left Side: Vertical Tool Directory (8 categories, 31 technology pills)
 * - Right Side: 3D Orbital Technology Ecosystem with central Tech Core
 * - Cross-interactive hover synchronizing directory pills and orbiting satellite nodes
 */

import { TOOLKIT_CATEGORIES, TOOLKIT_TECHNOLOGIES } from '../data/toolkit-data.js';
import { ToolkitOrbitEngine } from './toolkit-orbit.js';

export class ToolkitExperienceController {
  constructor() {
    this.section = document.getElementById('toolkit');
    if (!this.section) return;

    this.directoryCol = document.getElementById('toolkitDirectoryCol');
    this.viewport = document.getElementById('orbitalShowcaseViewport');
    this.nodesLayer = document.getElementById('orbitalNodesLayer');
    this.svgTracks = document.getElementById('orbitSvgTracks');
    this.techCore = document.getElementById('techCore');

    this.orbitEngine = null;

    this.init();
  }

  init() {
    this.renderDirectory();
    this.initOrbitalEngine();
    this.setupIntersectionReveal();
  }

  renderDirectory() {
    if (!this.directoryCol) return;

    this.directoryCol.innerHTML = '';
    const fragment = document.createDocumentFragment();

    TOOLKIT_CATEGORIES.forEach((categoryName) => {
      const catTechs = TOOLKIT_TECHNOLOGIES.filter(t => t.category === categoryName);
      if (catTechs.length === 0) return;

      const group = document.createElement('div');
      group.className = 'dir-category-group';

      const title = document.createElement('div');
      title.className = 'dir-category-title';
      title.textContent = categoryName;
      group.appendChild(title);

      const wrapper = document.createElement('div');
      wrapper.className = 'dir-tools-wrapper';

      catTechs.forEach((tech) => {
        const pill = document.createElement('div');
        pill.className = 'directory-tool-pill';
        pill.setAttribute('data-tech-name', tech.name);
        pill.setAttribute('data-cursor-hover', 'true');

        const logoHtml = tech.icon
          ? `<img src="${tech.icon}" class="pill-logo-img" alt="${tech.name}" onerror="this.onerror=null; this.outerHTML='<span class=\\'pill-icon-fallback\\'>●</span>';">`
          : `<span class="pill-icon-fallback">●</span>`;

        pill.innerHTML = `${logoHtml}<span>${tech.name}</span>`;

        // Interactive hover syncing with 3D Orbit
        pill.addEventListener('mouseenter', () => {
          this.highlightTool(tech.name, pill);
        });

        pill.addEventListener('mouseleave', () => {
          this.resetHighlight(pill);
        });

        wrapper.appendChild(pill);
      });

      group.appendChild(wrapper);
      fragment.appendChild(group);
    });

    this.directoryCol.appendChild(fragment);
  }

  initOrbitalEngine() {
    if (!this.viewport || !this.nodesLayer) return;

    this.orbitEngine = new ToolkitOrbitEngine(
      this.viewport,
      this.nodesLayer,
      this.svgTracks,
      this.techCore
    );
  }

  highlightTool(toolName, activePill) {
    if (activePill) {
      activePill.classList.add('active');
    }
    if (this.orbitEngine) {
      this.orbitEngine.highlightNode(toolName);
    }
  }

  resetHighlight(activePill) {
    if (activePill) {
      activePill.classList.remove('active');
    }
    if (this.orbitEngine) {
      this.orbitEngine.resetHighlight();
    }
  }

  setupIntersectionReveal() {
    if (!('IntersectionObserver' in window)) {
      this.section.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.section.classList.add('is-visible');
          if (this.orbitEngine) {
            this.orbitEngine.start();
          }
        } else {
          if (this.orbitEngine) {
            this.orbitEngine.stop();
          }
        }
      });
    }, {
      threshold: 0,
      rootMargin: '100px 0px'
    });

    observer.observe(this.section);
  }
}
