/**
 * projects-section.js — Portfolio 2.0
 * 
 * 3D Draggable Circular Project Carousel:
 * - Adapts the OrbitGallery 3D spatial cylindrical concept for text-based project cards
 * - Features the 8 verified projects from Portfolio 2.0 (Portfolio, VAULTIX, MyCloudStore,
 *   Explore The Globe, DoomChat, Toolock, Resuvana, CookPro)
 * - Natural pointer drag with inertia momentum & snap-to-card physics
 * - Clickable cards opening verified live project URLs in new tab
 * - Zero accidental navigation on drag release (drag distance threshold guard)
 * - Mobile pan-y touch-action: vertical page scrolling remains 100% natural and fluid
 * - Accessible controls: Left/Right arrow buttons, keyboard Arrow navigation, and 8 indicator dots
 * - Respects prefers-reduced-motion preferences
 */

import { PROJECTS } from '../data/projects-data.js';
import { motionEngine } from '../core/motion-engine.js';

export class ProjectsSectionController {
  constructor() {
    this.section = document.getElementById('projects');
    if (!this.section) return;

    this.wrapper = document.getElementById('projectsCarouselWrapper');
    this.stage = document.getElementById('projectsCarouselStage');
    this.track = document.getElementById('projectsCarouselTrack');
    this.prevBtn = document.getElementById('carouselPrevBtn');
    this.nextBtn = document.getElementById('carouselNextBtn');
    this.indicatorsWrap = document.getElementById('carouselIndicators');

    if (!this.stage || !this.track) return;

    this.projects = PROJECTS.slice(0, 8);
    this.itemsCount = this.projects.length;
    this.angleStep = 360 / this.itemsCount; // 45 degrees

    // Layout Metrics
    this.stageWidth = 900;
    this.faceWidth = 300;
    this.cardGap = 24;
    this.radius = 420;

    // Carousel State
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.activeIndex = 0;

    // Pointer Interaction State
    this.isDragging = false;
    this.pointerId = null;
    this.startX = 0;
    this.lastX = 0;
    this.lastTime = 0;
    this.velocity = 0;
    this.dragDistance = 0;
    this.ignoreClickUntil = 0;

    // Animation & Cleanup
    this.momentumRaf = null;
    this.cardElements = [];
    this.dotElements = [];
    this.unsubscribers = [];

    this.prefersReducedMotion = Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    this.init();
  }

  init() {
    this._renderCards();
    this._renderIndicators();
    this._updateDimensions();

    this._bindPointerEvents();
    this._bindControls();
    this._bindKeyboard();
    this._setupObservers();

    // Listen to reduced motion changes
    this.unsubscribers.push(
      motionEngine.subscribeMotionPreference((reduced) => {
        this.prefersReducedMotion = reduced;
      })
    );

    // Initial positioning
    this._updateTrackTransform();
  }

  /* ------------------------------------------------------------------
     1. CARD & INDICATOR RENDERING
     ------------------------------------------------------------------ */

  _renderCards() {
    this.track.innerHTML = '';
    const fragment = document.createDocumentFragment();
    this.cardElements = [];

    this.projects.forEach((project, index) => {
      const card = document.createElement('article');
      card.className = 'project-orbit-card';
      card.setAttribute('data-index', String(index));
      card.setAttribute('data-slug', project.slug);
      card.setAttribute('role', 'group');
      card.setAttribute('tabindex', '0');
      card.setAttribute(
        'aria-label',
        `Project ${project.number}: ${project.title} — ${project.category}. Click to explore live.`
      );

      const description = project.mainDescription || project.shortDescription;
      const techList = project.mainTech || project.tech.slice(0, 4);
      const techHTML = techList
        .map((t) => `<span class="orbit-card-tech-tag">${t}</span>`)
        .join('');

      card.innerHTML = `
        <div class="orbit-card-inner">
          <div class="orbit-card-topbar">
            <span class="orbit-card-number">${project.number}</span>
            <span class="orbit-card-category">${project.category}</span>
          </div>

          <h3 class="orbit-card-title">${project.title}</h3>
          <p class="orbit-card-desc">${description}</p>

          <div class="orbit-card-tech-list" aria-label="Technologies used">
            ${techHTML}
          </div>

          <div class="orbit-card-footer">
            <span class="orbit-card-action">EXPLORE PROJECT</span>
            <span class="orbit-card-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>
            </span>
          </div>
        </div>
      `;

      // Click card to open live URL
      card.addEventListener('click', (e) => {
        if (performance.now() < this.ignoreClickUntil) {
          e.preventDefault();
          return;
        }

        // If clicking a card that is not currently facing front, rotate it to front first,
        // or if it's already front-facing, open live project
        const cardAngle = index * this.angleStep;
        const normalizedRot = ((-this.currentRotation % 360) + 360) % 360;
        const diff = Math.abs(normalizedRot - cardAngle);
        const shortest = Math.min(diff, 360 - diff);

        if (shortest > 20) {
          e.preventDefault();
          this.rotateToIndex(index);
        } else if (project.liveUrl) {
          window.open(project.liveUrl, '_blank', 'noopener,noreferrer');
        }
      });

      // Keydown on card: Enter or Space opens liveUrl
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (project.liveUrl) {
            window.open(project.liveUrl, '_blank', 'noopener,noreferrer');
          }
        }
      });

      // Focus on card brings it to center
      card.addEventListener('focus', () => {
        this.rotateToIndex(index);
      });

      fragment.appendChild(card);
      this.cardElements.push(card);
    });

    this.track.appendChild(fragment);
  }

  _renderIndicators() {
    if (!this.indicatorsWrap) return;

    this.indicatorsWrap.innerHTML = '';
    const fragment = document.createDocumentFragment();
    this.dotElements = [];

    this.projects.forEach((project, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `carousel-indicator-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.setAttribute('aria-label', `Navigate to project ${project.number}: ${project.title}`);

      dot.addEventListener('click', () => {
        this.rotateToIndex(i);
      });

      fragment.appendChild(dot);
      this.dotElements.push(dot);
    });

    this.indicatorsWrap.appendChild(fragment);
  }

  /* ------------------------------------------------------------------
     2. RESPONSIVE DIMENSIONS & 3D GEOMETRY
     ------------------------------------------------------------------ */

  _updateDimensions() {
    this.stageWidth = this.stage.clientWidth || window.innerWidth || 900;

    if (this.stageWidth < 480) {
      this.faceWidth = Math.min(270, Math.max(220, Math.round(this.stageWidth * 0.74)));
      this.cardGap = 16;
    } else if (this.stageWidth < 768) {
      this.faceWidth = Math.min(290, Math.max(250, Math.round(this.stageWidth * 0.46)));
      this.cardGap = 20;
    } else if (this.stageWidth < 1100) {
      this.faceWidth = 295;
      this.cardGap = 22;
    } else {
      this.faceWidth = 320;
      this.cardGap = 26;
    }

    // Cylindrical radius calculation: radius = (faceWidth + cardGap) / (2 * sin(PI / N))
    this.radius = Math.round(
      (this.faceWidth + this.cardGap) / (2 * Math.sin(Math.PI / this.itemsCount))
    );

    const perspective = Math.max(880, Math.round(this.stageWidth * 1.15));
    this.stage.style.perspective = `${perspective}px`;

    // Position each card in 3D circular cylinder
    this.cardElements.forEach((card, i) => {
      const cardAngle = i * this.angleStep;
      card.style.width = `${this.faceWidth}px`;
      card.style.transform = `translate(-50%, -50%) rotateY(${cardAngle}deg) translateZ(${this.radius}px)`;
    });

    this._updateTrackTransform();
  }

  _setupObservers() {
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        this._updateDimensions();
      });
      ro.observe(this.stage);
      this.unsubscribers.push(() => ro.disconnect());
    } else {
      const onResize = () => this._updateDimensions();
      window.addEventListener('resize', onResize, { passive: true });
      this.unsubscribers.push(() => window.removeEventListener('resize', onResize));
    }
  }

  /* ------------------------------------------------------------------
     3. POINTER INTERACTIONS (Drag & Momentum)
     ------------------------------------------------------------------ */

  _bindPointerEvents() {
    const onPointerDown = (e) => {
      // Allow only primary button (0) or touch
      if (e.button !== undefined && e.button !== 0) return;

      this.stopMomentum();
      this.pointerId = e.pointerId;
      this.startX = e.clientX;
      this.lastX = e.clientX;
      this.lastTime = performance.now();
      this.velocity = 0;
      this.dragDistance = 0;
      this.isDragging = true;

      try {
        this.stage.setPointerCapture(e.pointerId);
      } catch (_) {}

      this.stage.classList.add('is-dragging');
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || e.pointerId !== this.pointerId) return;

      const now = performance.now();
      const deltaX = e.clientX - this.lastX;
      const dt = Math.max(now - this.lastTime, 8);

      this.velocity = (deltaX / dt) * 1000; // px / second
      this.dragDistance += Math.abs(deltaX);
      this.lastX = e.clientX;
      this.lastTime = now;

      // Responsive drag sensitivity: comfortable and intuitive
      const sensitivity = this.stageWidth < 600 ? 0.22 : 0.17;
      this.currentRotation += deltaX * sensitivity;

      this._updateTrackTransform();
    };

    const onPointerUp = (e) => {
      if (!this.isDragging || e.pointerId !== this.pointerId) return;

      this.isDragging = false;
      this.pointerId = null;
      this.stage.classList.remove('is-dragging');

      try {
        this.stage.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (this.dragDistance > 7) {
        this.ignoreClickUntil = performance.now() + 200;
      }

      // Smooth inertia momentum and snapping to nearest card
      const velocityImpact = Math.max(-140, Math.min(140, this.velocity * 0.12));
      const projected = this.currentRotation + velocityImpact;
      const nearestSlot = Math.round(projected / this.angleStep) * this.angleStep;

      if (!this.prefersReducedMotion && Math.abs(this.velocity) > 30) {
        this.rotateTo(nearestSlot);
      } else {
        this.rotateTo(Math.round(this.currentRotation / this.angleStep) * this.angleStep);
      }
    };

    this.stage.addEventListener('pointerdown', onPointerDown);
    this.stage.addEventListener('pointermove', onPointerMove);
    this.stage.addEventListener('pointerup', onPointerUp);
    this.stage.addEventListener('pointercancel', onPointerUp);

    this.unsubscribers.push(() => {
      this.stage.removeEventListener('pointerdown', onPointerDown);
      this.stage.removeEventListener('pointermove', onPointerMove);
      this.stage.removeEventListener('pointerup', onPointerUp);
      this.stage.removeEventListener('pointercancel', onPointerUp);
    });
  }

  /* ------------------------------------------------------------------
     4. CONTROLS & KEYBOARD ACCESSIBILITY
     ------------------------------------------------------------------ */

  _bindControls() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.rotateTo(this.currentRotation + this.angleStep);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.rotateTo(this.currentRotation - this.angleStep);
      });
    }
  }

  _bindKeyboard() {
    this.stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.rotateTo(this.currentRotation + this.angleStep);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.rotateTo(this.currentRotation - this.angleStep);
      }
    });
  }

  /* ------------------------------------------------------------------
     5. ROTATION ENGINE & TRANSFORM UPDATES
     ------------------------------------------------------------------ */

  stopMomentum() {
    if (this.momentumRaf) {
      cancelAnimationFrame(this.momentumRaf);
      this.momentumRaf = null;
    }
  }

  rotateTo(targetAngle) {
    this.stopMomentum();
    this.targetRotation = targetAngle;

    if (this.prefersReducedMotion) {
      this.currentRotation = targetAngle;
      this._updateTrackTransform();
      return;
    }

    const startAngle = this.currentRotation;
    const distance = targetAngle - startAngle;
    const duration = Math.min(650, Math.max(380, Math.abs(distance) * 5));
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease-out cubic curve
      const ease = 1 - Math.pow(1 - t, 3);

      this.currentRotation = startAngle + distance * ease;
      this._updateTrackTransform();

      if (t < 1) {
        this.momentumRaf = requestAnimationFrame(tick);
      } else {
        this.currentRotation = targetAngle;
        this._updateTrackTransform();
        this.momentumRaf = null;
      }
    };

    this.momentumRaf = requestAnimationFrame(tick);
  }

  rotateToIndex(targetIndex) {
    const targetSlotAngle = -targetIndex * this.angleStep;
    // Find shortest rotational path from current rotation
    const currentNormalized = this.currentRotation % 360;
    let diff = (targetSlotAngle - currentNormalized) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    this.rotateTo(this.currentRotation + diff);
  }

  _updateTrackTransform() {
    // Apply 3D rotation to track
    this.track.style.transform = `rotateY(${this.currentRotation.toFixed(2)}deg)`;

    // Calculate active front card index
    const normalized = ((-this.currentRotation % 360) + 360) % 360;
    const active = Math.round(normalized / this.angleStep) % this.itemsCount;
    this.activeIndex = active;

    // Update active indicators
    this.dotElements.forEach((dot, i) => {
      const isActive = i === active;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update cards depth modulation & visual hierarchy
    this.cardElements.forEach((card, i) => {
      const cardAngle = i * this.angleStep;
      // Angular distance from the camera front (0 degrees)
      const relAngle = ((cardAngle + this.currentRotation) % 360 + 360) % 360;
      const angleFromFront = Math.min(relAngle, 360 - relAngle);

      // Card is facing camera (front-half of cylinder)
      const isFrontFacing = angleFromFront <= 80;
      const isDirectFront = angleFromFront <= 22.5;

      card.classList.toggle('is-front', isFrontFacing);
      card.classList.toggle('is-active-center', isDirectFront);

      // Subtle depth opacity: front cards 1.0, sides 0.75, rear cards 0.35
      const depthOpacity = 1 - Math.pow(angleFromFront / 180, 1.2) * 0.68;
      card.style.opacity = depthOpacity.toFixed(3);
    });
  }

  destroy() {
    this.stopMomentum();
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}
