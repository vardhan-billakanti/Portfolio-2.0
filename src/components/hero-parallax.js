/**
 * PORTFOLIO 2.0 — HERO MULTI-LAYER PARALLAX & SCROLL TRANSITION
 * 
 * Coordinates clean depth parallax across the primary hero planes:
 * - Radial Streak Field (4-6px subtle drift)
 * - Center Typography Cluster (6-8px subtle drift)
 * - Floating Social Constellation (10-12px drift)
 * 
 * Features:
 * - Seamless scroll handoff: Hero typography recedes smoothly as user enters About Intro.
 * - Zero visual alteration of text colors or background.
 * - Uses MotionEngine coalesced RAF; safely disabled on touch and reduced-motion.
 */

import { motionEngine } from '../core/motion-engine.js';

export class HeroParallaxController {
  constructor() {
    this.section = document.getElementById('home');
    if (!this.section) return;

    // Cache DOM layers
    this.radialEl = document.querySelector('.radial-canvas-container');
    this.clusterEl = document.querySelector('.hero-center-cluster');
    this.socialEl = document.querySelector('.hero-social-constellation');

    // Parallax tracking
    this.targetX = 0;
    this.targetY = 0;
    this.currX = 0;
    this.currY = 0;

    this.unsubscribers = [];
    this.init();
  }

  init() {
    if (motionEngine.prefersReducedMotion) return;

    // 1. Subscribe to coalesced pointer
    this.unsubscribers.push(
      motionEngine.subscribePointer((p) => {
        if (motionEngine.isTouch) return;
        this.targetX = p.normX;
        this.targetY = p.normY;
      })
    );

    // 2. Subscribe to MotionEngine frame for smooth lerped parallax
    this.unsubscribers.push(
      motionEngine.subscribeFrame(() => this.tick())
    );

    // 3. Subscribe to scroll for smooth exit transition
    this.unsubscribers.push(
      motionEngine.subscribeScroll(() => this.onScroll())
    );
  }

  tick() {
    if (motionEngine.isTouch) return;

    // Smooth spring-lagged interpolation
    this.currX += (this.targetX - this.currX) * 0.055;
    this.currY += (this.targetY - this.currY) * 0.055;

    const x = this.currX;
    const y = this.currY;

    // Layer 1: Radial canvas (5px subtle drift)
    if (this.radialEl) {
      this.radialEl.style.transform = `translate3d(${(x * 5.0).toFixed(2)}px, ${(y * 5.0).toFixed(2)}px, 0)`;
    }

    // Layer 2: Center Cluster (7px subtle drift)
    if (this.clusterEl && !this.scrollExiting) {
      this.clusterEl.style.transform = `translate3d(${(x * 7.0).toFixed(2)}px, ${(y * 7.0).toFixed(2)}px, 0)`;
    }

    // Layer 3: Social Constellation (11px drift)
    if (this.socialEl && !this.scrollExiting) {
      this.socialEl.style.transform = `translate3d(${(x * 11.0).toFixed(2)}px, ${(y * 11.0).toFixed(2)}px, 0)`;
    }
  }

  onScroll() {
    const scrollY = motionEngine.scrollY;
    const heroH = window.innerHeight || 800;

    if (scrollY <= 0) {
      this.scrollExiting = false;
      if (this.clusterEl) this.clusterEl.style.opacity = '';
      return;
    }

    // Normalized exit progress
    const p = Math.min(1, Math.max(0, scrollY / (heroH * 0.65)));
    this.scrollExiting = p > 0.02;

    if (this.clusterEl) {
      // Refined, subtle upward recession during scroll handoff
      const exitY = -p * 24;
      const scale = 1 - p * 0.025;
      const opacity = Math.max(0, 1 - p * 1.4);
      this.clusterEl.style.transform = `translate3d(0, ${exitY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      this.clusterEl.style.opacity = opacity.toFixed(2);
    }
  }

  destroy() {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
  }
}
