/**
 * Custom Cursor Controller
 * Refined circular futuristic pointer:
 * - Center precision dot tracking 1:1 without delay
 * - Outer tracking ring with smooth lerp inertia
 * - Context-aware interactive expansion states
 * - Auto-pauses RAF loop when idle (0% CPU overhead)
 * - Completely disabled on touch devices
 */

export class CustomCursorController {
  constructor(cursorContainer) {
    this.container = cursorContainer;
    if (!this.container) return;

    this.dot = this.container.querySelector('.cursor-dot');
    this.ring = this.container.querySelector('.cursor-ring');

    if (!this.dot || !this.ring) return;

    // Detection: Touch devices do not get custom cursor
    if (this.isTouchDevice()) {
      this.container.style.display = 'none';
      return;
    }

    this.mouseX = -100;
    this.mouseY = -100;
    this.ringX = -100;
    this.ringY = -100;
    this.isMoving = false;
    this.rafId = null;
    this.hasMoved = false;

    this.init();
  }

  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  init() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });

    document.addEventListener('mouseenter', () => {
      this.container.classList.remove('cursor-hidden');
    });

    document.addEventListener('mouseleave', () => {
      this.container.classList.add('cursor-hidden');
    });

    document.addEventListener('mousedown', () => {
      this.container.classList.add('cursor-clicking');
    });

    document.addEventListener('mouseup', () => {
      this.container.classList.remove('cursor-clicking');
    });

    // Intelligent Hover State Delegation
    document.addEventListener('mouseover', (e) => this.onMouseOver(e));
    document.addEventListener('mouseout', (e) => this.onMouseOut(e));
  }

  onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    if (!this.hasMoved) {
      this.hasMoved = true;
      this.ringX = this.mouseX;
      this.ringY = this.mouseY;
      this.container.classList.add('cursor-active');
    }

    // Direct 1:1 tracking for center dot
    this.dot.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0) translate(-50%, -50%)`;

    // Start RAF loop if not already running
    if (!this.isMoving) {
      this.isMoving = true;
      this.rafId = requestAnimationFrame(() => this.updateRing());
    }
  }

  updateRing() {
    const dx = this.mouseX - this.ringX;
    const dy = this.mouseY - this.ringY;

    this.ringX += dx * 0.22;
    this.ringY += dy * 0.22;

    this.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) translate(-50%, -50%)`;

    // Keep updating until close to pointer
    if (Math.hypot(dx, dy) > 0.15) {
      this.rafId = requestAnimationFrame(() => this.updateRing());
    } else {
      this.ringX = this.mouseX;
      this.ringY = this.mouseY;
      this.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) translate(-50%, -50%)`;
      this.isMoving = false;
      this.rafId = null;
    }
  }

  onMouseOver(e) {
    const target = e.target;
    if (!target) return;

    if (target.closest('.nav-contact-capsule')) {
      this.setCursorState('cursor-cta');
    } else if (target.closest('.hero-social-circle')) {
      this.setCursorState('cursor-social');
    } else if (target.closest('.nav-link-item a, .nav-brand, .hero-scroll-indicator, .mobile-contact-link')) {
      this.setCursorState('cursor-link');
    } else if (target.closest('a, button, [role="button"]')) {
      this.setCursorState('cursor-hover');
    }
  }

  onMouseOut(e) {
    const related = e.relatedTarget;
    if (!related || !related.closest('a, button, [role="button"], .hero-social-circle, .nav-contact-capsule')) {
      this.setCursorState('');
    }
  }

  setCursorState(stateClass) {
    this.container.className = 'custom-cursor cursor-active' + (stateClass ? ` ${stateClass}` : '');
  }
}
