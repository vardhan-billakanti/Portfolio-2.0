/**
 * PORTFOLIO 2.0 — ABOUT ME CINEMATIC SCROLL TRANSITION
 * 
 * Exact Match to Portfolio 2.0 Design System:
 * - Pure black background: var(--pr-black-1000, #000000)
 * - Warm white to peach-orange palette: #ffffff -> #f7dcd0 -> #ff5c1a
 * - Razor-sharp editorial cursive typography: var(--font-signature, 'Instrument Serif')
 * - True letter-stroke typographic breakup into subtle lines and dots
 * 
 * 5-Phase Continuous Scroll Progress:
 * - Phase 1 (Enter): "About Me" appears centered, crisp, and high-contrast
 * - Phase 2 (Hold / Clarity): Centered, readable, 100% sharp
 * - Phase 3 (Enlarge): Scales smoothly larger while staying sharp
 * - Phase 4 (Breakup): The actual letters break apart into subtle tiny lines and dots
 * - Phase 5 (Disappear): Fragments disperse and fade out cleanly
 * - Immediate Handoff: Real About section appears directly with zero empty gap
 * 
 * Unidirectional Top -> Bottom Execution:
 * - Plays once when scrolling down into About
 * - Once passed, scrolling back UP does NOT replay or reverse
 * - Stage stays completely hidden on upward scroll
 * - Resets only when returning to the top of Hero (scrollY <= 80)
 */

export class AboutIntroController {
  constructor() {
    this.section = document.getElementById('about-intro');
    if (!this.section) return;

    this.stage = this.section.querySelector('.about-intro-stage');
    this.title = this.section.querySelector('.about-intro-title');
    this.canvas = this.section.querySelector('.about-intro-canvas');
    if (!this.stage || !this.title || !this.canvas) return;

    this.ctx = null;
    try {
      this.ctx = this.canvas.getContext('2d');
    } catch (e) {
      console.warn('[AboutIntro] Canvas 2D context creation failed:', e);
    }

    this.isReducedMotion = Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    // Cached layout geometry
    this.winH = 0;
    this.winW = 0;
    this.dpr = 1;
    this.scrollDistance = 1;

    // Fragments extracted directly from the letters
    this.fragments = [];
    this.targetScale = 1.65;
    this.hasSampled = false;

    // Scroll state tracking
    this.hasPassed = false;
    this.ticking = false;
    this.lastScrollY = window.scrollY || window.pageYOffset || 0;
    this.lastAppliedP = -999;

    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      this.hideStage();
      this.hasPassed = true;
      return;
    }

    this.measure();

    const rect = this.section.getBoundingClientRect();
    if (rect.bottom < this.winH) {
      this.hasPassed = true;
      this.hideStage();
    } else {
      this.hasPassed = false;
      this.hideStage();
    }

    this.attachListeners();

    // Ensure fonts are ready before sampling letter strokes
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.prepareFragments();
        this.onScrollUpdate();
      }).catch(() => {
        this.prepareFragments();
        this.onScrollUpdate();
      });
    } else {
      setTimeout(() => {
        this.prepareFragments();
        this.onScrollUpdate();
      }, 100);
    }

    this.onScrollUpdate();
  }

  measure() {
    this.winH = window.innerHeight || document.documentElement.clientHeight || 800;
    this.winW = window.innerWidth || document.documentElement.clientWidth || 1200;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const sectionH = this.section.offsetHeight || Math.round(this.winH * 1.3);
    this.scrollDistance = Math.max(100, sectionH - this.winH);

    // Responsive target scale for Phase 3
    if (this.winW <= 480) {
      this.targetScale = 1.20;
    } else if (this.winW < 768) {
      this.targetScale = 1.35;
    } else {
      this.targetScale = 1.65;
    }

    // Resize canvas with high-DPI transform
    if (this.canvas) {
      this.canvas.width = Math.floor(this.winW * this.dpr);
      this.canvas.height = Math.floor(this.winH * this.dpr);
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      if (this.ctx) {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
    }
  }

  /**
   * Sample the actual glyph strokes of "About Me" onto an offscreen canvas
   * and generate precise line and dot fragments matching the typography.
   */
  prepareFragments() {
    if (!this.title) return;

    const style = window.getComputedStyle(this.title);
    const fontSize = parseFloat(style.fontSize) || (this.winW <= 480 ? 36 : (this.winW < 768 ? 48 : 88));
    const fontFamily = style.fontFamily || "'Instrument Serif', Georgia, serif";
    const fontStyle = style.fontStyle || 'italic';
    const fontWeight = style.fontWeight || '400';

    // Scale font size to match Phase 3 enlargement so fragments originate at the enlarged scale
    const sampledFontSize = fontSize * this.targetScale;

    const offCanvas = document.createElement('canvas');
    let offCtx = null;
    try {
      offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    } catch (e) {
      return;
    }
    if (!offCtx) return;

    offCtx.font = `${fontStyle} ${fontWeight} ${sampledFontSize}px ${fontFamily}`;
    const textMetrics = offCtx.measureText('About Me');
    const textWidth = Math.ceil(textMetrics.width);
    const textHeight = Math.ceil(sampledFontSize * 1.5);

    offCanvas.width = textWidth + 80;
    offCanvas.height = textHeight + 80;

    // Render crisp gradient text on offscreen canvas
    const grad = offCtx.createLinearGradient(40, 0, 40 + textWidth, sampledFontSize);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.4, '#ffffff');
    grad.addColorStop(0.75, '#f7dcd0');
    grad.addColorStop(1.0, '#ff5c1a');

    offCtx.fillStyle = grad;
    offCtx.font = `${fontStyle} ${fontWeight} ${sampledFontSize}px ${fontFamily}`;
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText('About Me', offCanvas.width / 2, offCanvas.height / 2);

    let imgData = null;
    try {
      imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    } catch (e) {
      return;
    }
    if (!imgData) return;
    const data = imgData.data;

    // Grid sampling step for optimal density (~400 to 700 stroke fragments)
    const step = this.winW < 768 ? 4 : 3;
    const centerX = offCanvas.width / 2;
    const centerY = offCanvas.height / 2;

    // Restrained horizontal spread on mobile so fragments do not clip screen boundaries
    const horizontalSpread = Math.min(Math.round(this.winW * 0.32), this.winW <= 480 ? 110 : 340);

    this.fragments = [];

    for (let y = 0; y < offCanvas.height; y += step) {
      for (let x = 0; x < offCanvas.width; x += step) {
        const idx = (y * offCanvas.width + x) * 4;
        const alpha = data[idx + 3];

        // Sample points strictly within the letter glyph strokes
        if (alpha > 120) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const color = `rgba(${r}, ${g}, ${b}, 1)`;

          const relX = x - centerX;
          const relY = y - centerY;

          // 70% subtle line segments oriented along the italic angle, 30% small dots
          const isLine = Math.random() < 0.70;
          const len = 3.5 + Math.random() * 4.5;
          const angle = -0.22 + (Math.random() - 0.5) * 0.28; // Italic slant
          const lineWidth = 1.1 + Math.random() * 0.5;
          const radius = 1.0 + Math.random() * 0.8;

          // Organic drift vectors originating from letter geometry (restrained on mobile)
          const normX = relX / (textWidth / 2 || 1);
          const vx = (Math.random() - 0.5) * 40 + normX * horizontalSpread;
          const vy = (Math.random() - 0.5) * 40 - 10;
          const rotSpeed = (Math.random() - 0.5) * 2.2;
          const stagger = Math.random() * 0.12;

          this.fragments.push({
            relX,
            relY,
            isLine,
            len,
            angle,
            lineWidth,
            radius,
            color,
            vx,
            vy,
            rotSpeed,
            stagger
          });
        }
      }
    }

    this.hasSampled = true;
  }

  attachListeners() {
    this.onScroll = () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.onScrollUpdate();
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    this.onResize = () => {
      this.measure();
      this.prepareFragments();
      this.onScrollUpdate();
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    window.addEventListener('load', () => {
      this.measure();
      this.prepareFragments();
      this.onScrollUpdate();
    }, { once: true });
  }

  hideStage() {
    if (!this.stage || !this.title || !this.canvas) return;
    this.stage.style.opacity = '0';
    this.stage.style.visibility = 'hidden';
    this.stage.style.pointerEvents = 'none';
    this.title.style.opacity = '0';
    this.title.style.transform = 'translate3d(0, 0, 0) scale(1)';
    this.canvas.style.opacity = '0';
    this.canvas.style.pointerEvents = 'none';
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.winW, this.winH);
    }
    this.lastAppliedP = -999;
  }

  onScrollUpdate() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const delta = scrollY - this.lastScrollY;
    const isScrollingUp = delta < -10;

    // 1. Programmatic auto-scroll guard:
    if (window.__isProgrammaticNavScroll) {
      const target = window.__programmaticNavTarget;
      if (target && target !== 'home' && target !== 'about') {
        this.hasPassed = true;
      } else if (target === 'home') {
        this.hasPassed = false;
      }
      this.hideStage();
      this.lastScrollY = scrollY;
      return;
    }

    const rect = this.section.getBoundingClientRect();

    // 2. Reset passed guard when user returns to top of Hero (<= 80px)
    if (scrollY <= 80 || rect.top > this.winH * 0.7) {
      this.hasPassed = false;
    }

    // 3. Direction Guard: If user scrolls UP inside or past the section, hide stage (no reverse replay)
    if (isScrollingUp && rect.top < 0 && rect.bottom > 0) {
      this.hideStage();
      this.lastScrollY = scrollY;
      return;
    }

    // 4. If passed and already below section, keep stage hidden
    if (this.hasPassed && rect.bottom <= this.winH + 10) {
      this.hideStage();
      this.lastScrollY = scrollY;
      return;
    }

    // 5. Above transition start point (still in Hero)
    if (rect.top > 0) {
      this.hideStage();
      this.lastScrollY = scrollY;
      return;
    }

    // 6. Past transition end point (bottom of runway reached About)
    if (rect.bottom <= this.winH + 10) {
      this.hasPassed = true;
      this.hideStage();
      this.lastScrollY = scrollY;
      return;
    }

    // 7. Inside section runway: compute smooth scroll progress [0.0 ... 1.0]
    let progress = -rect.top / this.scrollDistance;
    progress = Math.max(0, Math.min(1, progress));

    this.applyProgress(progress);
    this.lastScrollY = scrollY;
  }

  applyProgress(p) {
    if (Math.abs(this.lastAppliedP - p) < 0.0008) return;
    this.lastAppliedP = p;

    let titleScale = 1.0;
    let titleOpacity = 0.0;
    let stageOpacity = 1.0;
    let canvasOpacity = 0.0;
    let dispersion = 0.0;
    let fragmentAlpha = 1.0;

    if (p < 0.18) {
      // -------------------------------------------------------------
      // PHASE 1 — ENTER (0.00 -> 0.18)
      // "About Me" appears centered, crisp, and high-contrast
      // -------------------------------------------------------------
      const t = p / 0.18;
      titleScale = 1.0;
      titleOpacity = t;
      stageOpacity = t;
      canvasOpacity = 0.0;
      dispersion = 0.0;

    } else if (p < 0.38) {
      // -------------------------------------------------------------
      // PHASE 2 — HOLD / CLARITY (0.18 -> 0.38)
      // Sits centered, crisp, 100% visible and readable
      // -------------------------------------------------------------
      const t = (p - 0.18) / (0.38 - 0.18);
      titleScale = 1.0 + 0.10 * t; // Gentle organic breath
      titleOpacity = 1.0;
      stageOpacity = 1.0;
      canvasOpacity = 0.0;
      dispersion = 0.0;

    } else if (p < 0.58) {
      // -------------------------------------------------------------
      // PHASE 3 — ENLARGE (0.38 -> 0.58)
      // Scales smoothly larger while remaining razor sharp
      // -------------------------------------------------------------
      const t = (p - 0.38) / (0.58 - 0.38);
      const ease = t * t * (3 - 2 * t); // Smoothstep easing
      titleScale = 1.10 + (this.targetScale - 1.10) * ease;
      titleOpacity = 1.0;
      stageOpacity = 1.0;
      canvasOpacity = 0.0;
      dispersion = 0.0;

    } else if (p < 0.82) {
      // -------------------------------------------------------------
      // PHASE 4 — BREAKUP (0.58 -> 0.82)
      // The actual letters progressively break apart into tiny lines and dots
      // -------------------------------------------------------------
      const t = (p - 0.58) / (0.82 - 0.58);

      // Smooth handoff from solid vector text to letter fragments at exact scale
      const handoffT = Math.min(1, (p - 0.58) / 0.07);
      titleOpacity = Math.max(0, 1.0 - handoffT);
      titleScale = this.targetScale;

      canvasOpacity = 1.0;
      stageOpacity = 1.0;

      // Progressive dispersion of letter fragments
      dispersion = Math.pow(t, 1.35);
      fragmentAlpha = 1.0;

    } else if (p <= 0.96) {
      // -------------------------------------------------------------
      // PHASE 5 — DISAPPEAR (0.82 -> 0.96)
      // Fragments disperse slightly further and smoothly fade to 0
      // -------------------------------------------------------------
      const t = (p - 0.82) / (0.96 - 0.82);

      titleOpacity = 0.0;
      titleScale = this.targetScale;

      dispersion = 1.0 + t * 0.45;
      fragmentAlpha = Math.max(0, 1.0 - Math.pow(t, 1.25));
      canvasOpacity = fragmentAlpha;
      stageOpacity = Math.max(0, 1.0 - Math.pow(t, 1.15));

    } else {
      // -------------------------------------------------------------
      // COMPLETION (p > 0.96)
      // Real About section is immediately revealed with zero gap
      // -------------------------------------------------------------
      titleOpacity = 0.0;
      canvasOpacity = 0.0;
      stageOpacity = 0.0;
      this.hasPassed = true;
    }

    // Stage visibility guard
    if (stageOpacity <= 0.005) {
      this.stage.style.visibility = 'hidden';
      this.stage.style.opacity = '0';
    } else {
      this.stage.style.visibility = 'visible';
      this.stage.style.opacity = stageOpacity.toFixed(3);
    }

    // Apply GPU transform and opacity to DOM title
    this.title.style.transform = `translate3d(0, 0, 0) scale(${titleScale.toFixed(3)})`;
    this.title.style.opacity = titleOpacity.toFixed(3);

    // Render Canvas letter fragments if in Phase 4 or 5
    if (canvasOpacity > 0.005 && this.fragments.length > 0) {
      this.canvas.style.opacity = canvasOpacity.toFixed(3);
      this.drawFragments(dispersion, fragmentAlpha);
    } else {
      this.canvas.style.opacity = '0';
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.winW, this.winH);
      }
    }
  }

  /**
   * Draw the typographic letter fragments (subtle lines and dots)
   * originating directly from the "About Me" letter strokes.
   */
  drawFragments(dispersion, alpha) {
    if (!this.ctx || this.fragments.length === 0) return;

    this.ctx.clearRect(0, 0, this.winW, this.winH);

    const centerX = this.winW / 2;
    const centerY = this.winH / 2;

    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const total = this.fragments.length;
    for (let i = 0; i < total; i++) {
      const f = this.fragments[i];

      // Staggered individual breakup progression
      const activeDisp = Math.max(0, dispersion - f.stagger * 0.4);
      if (activeDisp <= 0 && dispersion === 0) {
        // At 0 dispersion, fragment sits precisely on the letter stroke
        var curX = centerX + f.relX;
        var curY = centerY + f.relY;
        var curAngle = f.angle;
      } else {
        var curX = centerX + f.relX + f.vx * activeDisp;
        var curY = centerY + f.relY + f.vy * activeDisp;
        var curAngle = f.angle + f.rotSpeed * activeDisp;
      }

      this.ctx.fillStyle = f.color;
      this.ctx.strokeStyle = f.color;

      if (f.isLine) {
        // Draw subtle line fragment oriented along italic slant
        const halfL = (f.len / 2) * (1 + activeDisp * 0.2);
        const cos = Math.cos(curAngle);
        const sin = Math.sin(curAngle);

        this.ctx.lineWidth = f.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(curX - cos * halfL, curY - sin * halfL);
        this.ctx.lineTo(curX + cos * halfL, curY + sin * halfL);
        this.ctx.stroke();
      } else {
        // Draw very small dot fragment
        const r = f.radius * (1 - activeDisp * 0.15);
        if (r > 0.3) {
          this.ctx.beginPath();
          this.ctx.arc(curX, curY, r, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }
}
