/**
 * PORTFOLIO 2.0 — CUSTOM CURSOR CONTROLLER
 * 
 * High-performance, tactile cursor architecture:
 * - Single Shared RAF Loop: Integrated with MotionEngine to eliminate raw event DOM writes.
 * - Center precision dot tracking 1:1 without input lag.
 * - Outer tracking ring with smooth, spring-like inertial lerp.
 * - Comprehensive state registry: normal, link, button, project, image, magnetic, drag, bob, cta, social.
 * - Auto-pauses RAF loop when stationary (0% CPU overhead at rest).
 * - Complete touch & reduced-motion safety bypass.
 */

import { motionEngine } from '../core/motion-engine.js';

export class CustomCursorController {
  constructor(cursorContainer) {
    this.container = cursorContainer;
    if (!this.container) return;

    this.dot = this.container.querySelector('.cursor-dot');
    this.ring = this.container.querySelector('.cursor-ring');

    if (!this.dot || !this.ring) return;

    // Safety: Touch devices do not render custom cursor
    if (motionEngine.isTouch || !motionEngine.hasFinePointer) {
      this.container.style.display = 'none';
      return;
    }

    this.mouseX = -100;
    this.mouseY = -100;
    this.ringX = -100;
    this.ringY = -100;
    this.isMoving = false;
    this.hasMoved = false;
    this.isVisible = false;
    this.currentState = '';

    this.unsubscribeFrame = null;
    this.init();
  }

  init() {
    // 1. Subscribe to coalesced pointer updates from MotionEngine
    motionEngine.subscribePointer((p) => {
      this.mouseX = p.x;
      this.mouseY = p.y;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.ringX = this.mouseX;
        this.ringY = this.mouseY;
        this.container.classList.add('cursor-active');
      }

      // Activate RAF loop if not already ticking
      if (!this.isMoving) {
        this.isMoving = true;
        this.startLoop();
      }
    });

    // 2. Mouse enter / leave viewport listeners
    document.addEventListener('mouseenter', () => {
      this.isVisible = true;
      this.container.classList.remove('cursor-hidden');
    });

    document.addEventListener('mouseleave', () => {
      this.isVisible = false;
      this.container.classList.add('cursor-hidden');
    });

    // 3. Click compression feedback
    document.addEventListener('mousedown', () => {
      this.container.classList.add('cursor-clicking');
    });

    document.addEventListener('mouseup', () => {
      this.container.classList.remove('cursor-clicking');
    });

    // 4. Intelligent hover state delegation
    document.addEventListener('mouseover', (e) => this.onMouseOver(e));
    document.addEventListener('mouseout', (e) => this.onMouseOut(e));
  }

  startLoop() {
    if (this.unsubscribeFrame) return;
    this.unsubscribeFrame = motionEngine.subscribeFrame(() => this.updateTransforms());
  }

  stopLoop() {
    if (this.unsubscribeFrame) {
      this.unsubscribeFrame();
      this.unsubscribeFrame = null;
    }
    this.isMoving = false;
  }

  updateTransforms() {
    if (!this.hasMoved) return;

    // Direct 1:1 translation for center precision dot (executed during RAF, not raw event)
    this.dot.style.transform = `translate3d(${this.mouseX.toFixed(1)}px, ${this.mouseY.toFixed(1)}px, 0) translate(-50%, -50%)`;

    // Outer ring smooth inertial lerp
    const dx = this.mouseX - this.ringX;
    const dy = this.mouseY - this.ringY;

    this.ringX += dx * 0.24;
    this.ringY += dy * 0.24;

    this.ring.style.transform = `translate3d(${this.ringX.toFixed(1)}px, ${this.ringY.toFixed(1)}px, 0) translate(-50%, -50%)`;

    // Settle to rest when ring matches pointer coordinates
    const distance = Math.hypot(dx, dy);
    if (distance < 0.15) {
      this.ringX = this.mouseX;
      this.ringY = this.mouseY;
      this.ring.style.transform = `translate3d(${this.ringX.toFixed(1)}px, ${this.ringY.toFixed(1)}px, 0) translate(-50%, -50%)`;
      this.stopLoop();
    }
  }

  onMouseOver(e) {
    const target = e.target;
    if (!target) return;

    // State matching hierarchy
    if (target.closest('#bob-floating-wrapper, #bob-trigger-floating, [data-cursor="bob"]')) {
      this.setCursorState('cursor-bob');
    } else if (target.closest('.nav-contact-capsule')) {
      this.setCursorState('cursor-cta');
    } else if (target.closest('.hero-social-circle')) {
      this.setCursorState('cursor-social');
    } else if (target.closest('.project-card, [data-cursor="project"]')) {
      this.setCursorState('cursor-project');
    } else if (target.closest('.cert-fan-card, [data-cursor="image"]')) {
      this.setCursorState('cursor-image');
    } else if (target.closest('[data-cursor="magnetic"]')) {
      this.setCursorState('cursor-magnetic');
    } else if (target.closest('.cert-stack-wrapper, [data-cursor="drag"]')) {
      this.setCursorState('cursor-drag');
    } else if (target.closest('button, .btn, [role="button"]')) {
      this.setCursorState('cursor-button');
    } else if (target.closest('.nav-link-item a, .nav-brand, .hero-scroll-indicator, .mobile-contact-link, a')) {
      this.setCursorState('cursor-link');
    }
  }

  onMouseOut(e) {
    const related = e.relatedTarget;
    if (!related || !related.closest('a, button, [role="button"], .hero-social-circle, .nav-contact-capsule, .project-card, .cert-fan-card, #bob-floating-wrapper')) {
      this.setCursorState('');
    }
  }

  setCursorState(stateClass) {
    if (this.currentState === stateClass) return;
    this.currentState = stateClass;
    this.container.className = 'custom-cursor cursor-active' + (stateClass ? ` ${stateClass}` : '');
  }
}
