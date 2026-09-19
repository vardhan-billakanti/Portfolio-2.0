/**
 * Radial Streak Canvas Engine — High-Speed Cinematic Field
 * Clearly visible, fast-moving radial speed lines radiating outward.
 * Layered visual hierarchy (bright, medium, subtle, accent),
 * dynamic streak elongation with distance, and smooth 60fps performance.
 * 
 * Performance Enhancements:
 * - Integrated with MotionEngine for coordinated tab visibility (0% CPU when tab hidden).
 * - Adaptive Canvas DPR based on device capability (prevents mobile GPU thermal throttling).
 * - Coalesced pointer parallax updates (no raw mousemove listeners).
 * - Automatic pause when section leaves viewport via IntersectionObserver.
 */

import { motionEngine } from '../core/motion-engine.js';

export class RadialStreakCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: true });
    
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.maxRadius = 0;
    this.dpr = motionEngine.dpr;

    // Micro-parallax damping
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.currentMouseX = 0;
    this.currentMouseY = 0;

    // Simulation parameters — noticeably faster
    this.streaks = [];
    this.active = true;
    this.globalAlpha = 0;
    this.speedMultiplier = 2.2;
    this.targetSpeedMultiplier = 2.2;
    this.spawnInnerRadius = 25;

    this.rafId = null;
    this.unsubscribers = [];

    this.init();
  }

  init() {
    this.handleResize();

    // 1. Subscribe to debounced resize
    this.unsubscribers.push(
      motionEngine.subscribeResize(() => this.handleResize())
    );

    // 2. Subscribe to coalesced pointer updates for micro-parallax
    this.unsubscribers.push(
      motionEngine.subscribePointer((p) => {
        if (!this.active || motionEngine.isTouch) return;
        this.targetMouseX = p.normX * 22;
        this.targetMouseY = p.normY * 22;
      })
    );

    // 3. Tab Visibility hook (stop RAF completely when tab is hidden)
    this.unsubscribers.push(
      motionEngine.subscribeVisibility((visible) => {
        if (visible && this.active) {
          if (!this.rafId) this.animate();
        } else {
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        }
      })
    );

    // 4. Viewport IntersectionObserver
    const heroSection = document.getElementById('home') || this.canvas;
    if ('IntersectionObserver' in window && heroSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.active = entry.isIntersecting && motionEngine.isVisible;
          if (this.active) {
            if (!this.rafId) {
              this.animate();
            }
          } else {
            if (this.rafId) {
              cancelAnimationFrame(this.rafId);
              this.rafId = null;
            }
          }
        });
      }, { threshold: 0, rootMargin: '50px 0px' });

      observer.observe(heroSection);
    }

    this.animate();
  }

  handleResize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : (window.innerWidth + 64);
    this.height = parent ? parent.clientHeight : (window.innerHeight + 64);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.maxRadius = Math.hypot(this.centerX, this.centerY) * 1.05;
    this.dpr = motionEngine.dpr;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.generateStreaks();
  }

  generateStreaks() {
    // Balanced density: rich and cinematic without clutter
    let count = 260;
    if (this.width < 768) {
      count = 95; // Mobile density
    } else if (this.width < 1200) {
      count = 175;
    }

    this.streaks = [];
    for (let i = 0; i < count; i++) {
      this.streaks.push(this.createStreak(true));
    }
  }

  createStreak(initialScatter = false) {
    const angle = Math.random() * Math.PI * 2;
    
    // Distribute along radius during boot, or start near center on recycle
    const startRadius = initialScatter 
      ? this.spawnInnerRadius + Math.random() * (this.maxRadius - this.spawnInnerRadius)
      : this.spawnInnerRadius + Math.random() * 45;

    // Visual hierarchy:
    // 25% Bright high-contrast white streaks
    // 45% Medium crisp white streaks
    // 24% Subtle depth streaks
    // 6% Warm ember orange accent streaks
    const rand = Math.random();
    let colorPrefix = 'rgba(255, 255, 255, ';
    let baseWidth = 1.4;
    let baseLength = 35 + Math.random() * 45;
    let baseOpacity = 0.55;

    if (rand > 0.94) {
      // Warm Ember Orange Accent (Restrained, vivid)
      colorPrefix = 'rgba(255, 77, 0, ';
      baseWidth = 2.0;
      baseLength = 50 + Math.random() * 60;
      baseOpacity = 0.85 + Math.random() * 0.15;
    } else if (rand > 0.72) {
      // Bright high-contrast white
      colorPrefix = 'rgba(255, 255, 255, ';
      baseWidth = 1.8;
      baseLength = 45 + Math.random() * 65;
      baseOpacity = 0.80 + Math.random() * 0.18;
    } else if (rand < 0.24) {
      // Subtle depth lines
      colorPrefix = 'rgba(235, 235, 240, ';
      baseWidth = 1.0;
      baseLength = 25 + Math.random() * 35;
      baseOpacity = 0.25 + Math.random() * 0.20;
    } else {
      // Medium crisp white
      colorPrefix = 'rgba(255, 255, 255, ';
      baseWidth = 1.35;
      baseLength = 35 + Math.random() * 45;
      baseOpacity = 0.55 + Math.random() * 0.20;
    }

    // High base velocity (1.5x - 2x faster)
    const baseSpeed = 4.2 + Math.random() * 5.8;

    return {
      angle,
      r: startRadius,
      baseSpeed,
      baseLength,
      width: baseWidth,
      baseOpacity,
      colorPrefix
    };
  }

  setSpeed(targetMultiplier, immediate = false) {
    this.targetSpeedMultiplier = targetMultiplier;
    if (immediate) {
      this.speedMultiplier = targetMultiplier;
    }
  }

  setGlobalAlpha(targetAlpha) {
    this.globalAlpha = targetAlpha;
  }

  animate() {
    if (!this.active || !motionEngine.isVisible) {
      this.rafId = null;
      return;
    }

    // Smooth speed interpolation
    this.speedMultiplier += (this.targetSpeedMultiplier - this.speedMultiplier) * 0.08;

    // Smooth mouse parallax damping
    this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.05;
    this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.05;

    const effCenterX = this.centerX + this.currentMouseX;
    const effCenterY = this.centerY + this.currentMouseY;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.globalAlpha > 0.001) {
      for (let i = 0; i < this.streaks.length; i++) {
        const s = this.streaks[i];

        // Outward radial acceleration: velocity scales with distance from center
        const radialProgress = s.r / this.maxRadius;
        const speedScale = 0.5 + radialProgress * 1.5;
        const step = s.baseSpeed * this.speedMultiplier * speedScale;
        s.r += step;

        // Dynamic streak stretch as line travels outward
        const currentLength = s.baseLength * (0.6 + radialProgress * 1.8) * (this.speedMultiplier / 2.0);

        // Recycle when streak leaves screen
        if (s.r - currentLength > this.maxRadius) {
          Object.assign(s, this.createStreak(false));
          continue;
        }

        // Controlled center emergence: soft fade in inner 100px so lines originate smoothly
        let fadeAlpha = 1;
        if (s.r < 110) {
          fadeAlpha = Math.max(0, (s.r - this.spawnInnerRadius) / (110 - this.spawnInnerRadius));
        }

        const finalOpacity = Math.min(1, s.baseOpacity * fadeAlpha * this.globalAlpha);
        if (finalOpacity <= 0.01) continue;

        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);

        // Head (furthest outward)
        const x1 = effCenterX + cos * s.r;
        const y1 = effCenterY + sin * s.r;

        // Tail (closer to center)
        const tailR = Math.max(this.spawnInnerRadius, s.r - currentLength);
        const x2 = effCenterX + cos * tailR;
        const y2 = effCenterY + sin * tailR;

        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x1, y1);
        this.ctx.strokeStyle = `${s.colorPrefix}${finalOpacity})`;
        this.ctx.lineWidth = s.width;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
    }

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
