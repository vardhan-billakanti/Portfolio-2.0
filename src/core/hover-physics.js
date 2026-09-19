/**
 * PORTFOLIO 2.0 — REUSABLE HOVER PHYSICS & INTERACTION ENGINE
 * 
 * Reusable foundation for tactile, physics-based micro-interactions:
 * - Magnetic Attraction: Elements pull gently toward the cursor (translate3d).
 * - Subtle Perspective Tilt: 3D rotation (rotateX, rotateY) using spring-damped lerp.
 * - Cursor-Relative Spotlight: Injects CSS variables (--mouse-x, --mouse-y, --mouse-norm-x, --mouse-norm-y)
 *   for smooth radial gradient highlights without triggering layout recalculations.
 * - Velocity-Aware Damping & Spring Return: Elements settle back to rest organically upon mouseleave.
 * - Hardware Accelerated: Uses exclusively translate3d/rotate3d transforms.
 * - Adaptive & Accessible: Safely bypasses on touch devices and reduced-motion mode.
 */

import { motionEngine } from './motion-engine.js';

export class HoverPhysicsController {
  constructor(element, options = {}) {
    this.el = element;
    if (!this.el) return;

    // Configuration with gentle, restrained defaults
    this.options = {
      magnetic: options.magnetic || false, // false, true, or number (e.g. 0.2)
      magneticStrength: typeof options.magnetic === 'number' ? options.magnetic : 0.22,
      maxMagneticOffset: options.maxMagneticOffset || 12, // px max displacement

      tilt: options.tilt || false, // false, true, or number (e.g. 6 deg)
      maxTilt: typeof options.tilt === 'number' ? options.tilt : 6.5, // degrees
      perspective: options.perspective || 900, // px

      spotlight: options.spotlight !== undefined ? options.spotlight : true,
      
      springDamping: options.springDamping || 0.18,
      springStiffness: options.springStiffness || 0.12,

      ...options
    };

    // Physics state
    this.isHovered = false;
    this.rect = null;

    // Current interpolated transforms
    this.currX = 0;
    this.currY = 0;
    this.currRotX = 0;
    this.currRotY = 0;

    // Target transforms
    this.targetX = 0;
    this.targetY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;

    this.unsubscribeFrame = null;
    this.init();
  }

  init() {
    // Coarse pointer & reduced-motion safety check
    if (motionEngine.isTouch || motionEngine.prefersReducedMotion) {
      return;
    }

    this.bindEvents();
  }

  bindEvents() {
    this.el.addEventListener('mouseenter', (e) => this.onMouseEnter(e), { passive: true });
    this.el.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    this.el.addEventListener('mouseleave', () => this.onMouseLeave(), { passive: true });
  }

  measure() {
    this.rect = this.el.getBoundingClientRect();
  }

  onMouseEnter(e) {
    if (motionEngine.isTouch || motionEngine.prefersReducedMotion) return;

    this.isHovered = true;
    this.measure();
    this.updateTargets(e);

    // Register frame loop with MotionEngine
    if (!this.unsubscribeFrame) {
      this.unsubscribeFrame = motionEngine.subscribeFrame(() => this.tick());
    }
  }

  onMouseMove(e) {
    if (!this.isHovered) return;
    this.updateTargets(e);
  }

  updateTargets(e) {
    if (!this.rect) this.measure();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const relX = clientX - this.rect.left;
    const relY = clientY - this.rect.top;

    const width = this.rect.width || 1;
    const height = this.rect.height || 1;

    // Normalized coordinates [-1, 1] relative to element center
    const normX = ((relX / width) * 2) - 1;
    const normY = ((relY / height) * 2) - 1;

    // 1. Cursor-relative spotlight CSS custom properties
    if (this.options.spotlight) {
      this.el.style.setProperty('--mouse-x', `${relX.toFixed(1)}px`);
      this.el.style.setProperty('--mouse-y', `${relY.toFixed(1)}px`);
      this.el.style.setProperty('--mouse-norm-x', normX.toFixed(3));
      this.el.style.setProperty('--mouse-norm-y', normY.toFixed(3));
    }

    // 2. Magnetic Attraction Target
    if (this.options.magnetic) {
      const maxDist = this.options.maxMagneticOffset;
      const strength = this.options.magneticStrength;
      this.targetX = Math.max(-maxDist, Math.min(maxDist, (relX - width / 2) * strength));
      this.targetY = Math.max(-maxDist, Math.min(maxDist, (relY - height / 2) * strength));
    }

    // 3. Perspective Tilt Target
    if (this.options.tilt) {
      const maxTilt = this.options.maxTilt;
      // Inverted pitch so card angles toward pointer
      this.targetRotX = -normY * maxTilt;
      this.targetRotY = normX * maxTilt;
    }
  }

  onMouseLeave() {
    this.isHovered = false;

    // Reset targets to resting origin
    this.targetX = 0;
    this.targetY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
  }

  tick() {
    const damping = this.options.springDamping;

    // Spring-damped interpolation toward targets
    this.currX += (this.targetX - this.currX) * damping;
    this.currY += (this.targetY - this.currY) * damping;
    this.currRotX += (this.targetRotX - this.currRotX) * damping;
    this.currRotY += (this.targetRotY - this.currRotY) * damping;

    // Build hardware-accelerated transform
    const transforms = [];

    if (this.options.magnetic && (Math.abs(this.currX) > 0.05 || Math.abs(this.currY) > 0.05)) {
      transforms.push(`translate3d(${this.currX.toFixed(2)}px, ${this.currY.toFixed(2)}px, 0)`);
    }

    if (this.options.tilt && (Math.abs(this.currRotX) > 0.05 || Math.abs(this.currRotY) > 0.05)) {
      transforms.push(`perspective(${this.options.perspective}px) rotateX(${this.currRotX.toFixed(2)}deg) rotateY(${this.currRotY.toFixed(2)}deg)`);
    }

    if (transforms.length > 0) {
      this.el.style.transform = transforms.join(' ');
    } else {
      this.el.style.transform = '';
    }

    // Check if element has settled to rest
    const isSettled = !this.isHovered &&
      Math.abs(this.currX) < 0.05 &&
      Math.abs(this.currY) < 0.05 &&
      Math.abs(this.currRotX) < 0.05 &&
      Math.abs(this.currRotY) < 0.05;

    if (isSettled) {
      this.el.style.transform = '';
      if (this.unsubscribeFrame) {
        this.unsubscribeFrame();
        this.unsubscribeFrame = null;
      }
    }
  }

  destroy() {
    if (this.unsubscribeFrame) {
      this.unsubscribeFrame();
      this.unsubscribeFrame = null;
    }
    this.el.style.transform = '';
  }
}

/**
 * Helper to attach hover physics to elements matching a selector or NodeList
 */
export function attachHoverPhysics(targets, options = {}) {
  const elements = typeof targets === 'string' ? document.querySelectorAll(targets) : targets;
  if (!elements) return [];

  const list = Array.from(elements.length !== undefined ? elements : [elements]);
  return list.map(el => new HoverPhysicsController(el, options));
}
