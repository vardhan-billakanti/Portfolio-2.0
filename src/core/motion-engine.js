/**
 * PORTFOLIO 2.0 — GLOBAL MOTION & PERFORMANCE ENGINE
 * 
 * High-performance centralized foundation for coordinated web motion:
 * - Coalesced Pointer Tracking: Buffers raw mouse/pointer input, computes normalized [-1, 1]
 *   coordinates, velocities (vx, vy), and dispatches updates inside requestAnimationFrame.
 * - Coalesced Scroll Tracking: Zero layout reflows, velocity tracking, and scroll direction.
 * - Single Shared RAF Loop: Powers multiple subscribers with clamped delta time (dt) and automatic idle sleep.
 * - Visibility & Tab Lifecycle: Automatically sleeps heavy rendering loops when browser tab is inactive.
 * - Adaptive Device Capabilities: Detects fine pointer vs touch, mobile viewports, and dynamically
 *   adapts Canvas DPR, particle/streak density, and animation frequencies.
 * - Reduced Motion Compliance: System-level respect for 'prefers-reduced-motion: reduce'.
 */

class MotionEngine {
  constructor() {
    this.isInitialized = false;

    // Device & Capability Flags
    this.isClient = typeof window !== 'undefined';
    this.hasFinePointer = false;
    this.isTouch = false;
    this.isMobile = false;
    this.isTablet = false;
    this.dpr = 1;
    this.prefersReducedMotion = false;
    this.isVisible = true;

    // Viewport Metrics
    this.viewportWidth = 1200;
    this.viewportHeight = 800;

    // Pointer State (Coalesced)
    this.pointer = {
      x: -100,
      y: -100,
      targetX: -100,
      targetY: -100,
      normX: 0,
      normY: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      isDown: false,
      hasMoved: false
    };
    this._lastPointerX = -100;
    this._lastPointerY = -100;
    this._lastPointerTime = 0;

    // Scroll State (Coalesced)
    this.scroll = {
      y: 0,
      x: 0,
      targetY: 0,
      targetX: 0,
      vy: 0,
      direction: 'none', // 'down' | 'up' | 'none'
      isScrolling: false
    };
    this._lastScrollY = 0;
    this._lastScrollTime = 0;
    this._scrollIdleTimer = null;

    // Subscriber Sets
    this.frameSubscribers = new Set();
    this.pointerSubscribers = new Set();
    this.scrollSubscribers = new Set();
    this.resizeSubscribers = new Set();
    this.visibilitySubscribers = new Set();

    // Loop State
    this.rafId = null;
    this.isRunning = false;
    this.lastFrameTime = 0;

    if (this.isClient) {
      this.init();
    }
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.detectCapabilities();
    this.updateViewportDimensions();

    this.bindEvents();
  }

  detectCapabilities() {
    this.prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.hasFinePointer = window.matchMedia && 
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.isTouch = 'ontouchstart' in window || 
      (navigator.maxTouchPoints > 0) || 
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    // Adaptive DPR: Prevent mobile GPU thermal throttling while keeping desktop razor-sharp
    const rawDpr = window.devicePixelRatio || 1;
    this.dpr = this.isTouch ? Math.min(rawDpr, 1.25) : Math.min(rawDpr, 2.0);

    // Reduced motion media query listener
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        this.notifyVisibility(this.isVisible);
      });
    }
  }

  updateViewportDimensions() {
    this.viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    this.viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    this.isMobile = this.viewportWidth < 768;
    this.isTablet = this.viewportWidth >= 768 && this.viewportWidth < 1200;
  }

  bindEvents() {
    // 1. Raw Pointer Tracking (Buffers coordinates without immediate DOM layout or mutation)
    const onPointerMove = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      this.pointer.targetX = clientX;
      this.pointer.targetY = clientY;

      if (!this.pointer.hasMoved) {
        this.pointer.hasMoved = true;
        this.pointer.x = clientX;
        this.pointer.y = clientY;
      }

      // Ensure frame loop is active while pointer moves
      this.ensureRunning();
    };

    if ('PointerEvent' in window) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    } else {
      window.addEventListener('mousemove', onPointerMove, { passive: true });
    }

    window.addEventListener('pointerdown', () => {
      this.pointer.isDown = true;
      this.ensureRunning();
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      this.pointer.isDown = false;
    }, { passive: true });

    // 2. Raw Scroll Tracking (Coalesced to RAF)
    const onScroll = () => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const currentX = window.scrollX || window.pageXOffset || 0;

      this.scroll.targetY = currentY;
      this.scroll.targetX = currentX;
      this.scroll.isScrolling = true;

      clearTimeout(this._scrollIdleTimer);
      this._scrollIdleTimer = setTimeout(() => {
        this.scroll.isScrolling = false;
        this.scroll.vy = 0;
      }, 150);

      this.ensureRunning();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // 3. Debounced Resize Handler
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateViewportDimensions();
        this.detectCapabilities();
        this.resizeSubscribers.forEach(cb => {
          try { cb(this.viewportWidth, this.viewportHeight); } catch (err) { console.error('[MotionEngine] resize callback error:', err); }
        });
      }, 100);
    }, { passive: true });

    // 4. Page Visibility API (Sleep loop when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      this.notifyVisibility(this.isVisible);

      if (this.isVisible) {
        this.lastFrameTime = performance.now();
        this.ensureRunning();
      } else {
        this.stopLoop();
      }
    }, { passive: true });

    // Initial scroll position
    this.scroll.y = window.scrollY || window.pageYOffset || 0;
    this.scroll.targetY = this.scroll.y;
  }

  notifyVisibility(visible) {
    this.visibilitySubscribers.forEach(cb => {
      try { cb(visible); } catch (err) { console.error('[MotionEngine] visibility callback error:', err); }
    });
  }

  ensureRunning() {
    if (!this.isRunning && this.isVisible) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  tick = (now) => {
    if (!this.isRunning) return;

    const dt = Math.min(now - this.lastFrameTime, 32); // Clamp to avoid large jumps
    this.lastFrameTime = now;

    // 1. Process Coalesced Pointer Updates
    const px = this.pointer.x;
    const py = this.pointer.y;
    const tx = this.pointer.targetX;
    const ty = this.pointer.targetY;

    const dx = tx - px;
    const dy = ty - py;

    if (this.pointer.hasMoved) {
      // Calculate pointer velocity and normalized coordinates
      this.pointer.x = tx;
      this.pointer.y = ty;

      const timeDelta = Math.max(now - this._lastPointerTime, 8);
      this.pointer.vx = (tx - this._lastPointerX) / timeDelta;
      this.pointer.vy = (ty - this._lastPointerY) / timeDelta;
      this.pointer.speed = Math.hypot(this.pointer.vx, this.pointer.vy);

      this._lastPointerX = tx;
      this._lastPointerY = ty;
      this._lastPointerTime = now;

      this.pointer.normX = ((tx / this.viewportWidth) * 2) - 1;
      this.pointer.normY = ((ty / this.viewportHeight) * 2) - 1;

      // Broadcast pointer update to subscribers
      this.pointerSubscribers.forEach(cb => {
        try { cb(this.pointer); } catch (err) { console.error('[MotionEngine] pointer callback error:', err); }
      });
    }

    // 2. Process Coalesced Scroll Updates
    const prevScrollY = this.scroll.y;
    const targetScrollY = this.scroll.targetY;

    if (Math.abs(targetScrollY - prevScrollY) > 0.05 || this.scroll.isScrolling) {
      const scrollDt = Math.max(now - this._lastScrollTime, 8);
      this.scroll.vy = (targetScrollY - prevScrollY) / scrollDt;
      this.scroll.direction = targetScrollY > prevScrollY ? 'down' : (targetScrollY < prevScrollY ? 'up' : 'none');

      this.scroll.y = targetScrollY;
      this.scroll.x = this.scroll.targetX;

      this._lastScrollY = targetScrollY;
      this._lastScrollTime = now;

      // Broadcast scroll update to subscribers
      this.scrollSubscribers.forEach(cb => {
        try { cb(this.scroll); } catch (err) { console.error('[MotionEngine] scroll callback error:', err); }
      });
    }

    // 3. Dispatch to Generic Animation Frame Subscribers
    this.frameSubscribers.forEach(cb => {
      try { cb(dt, now); } catch (err) { console.error('[MotionEngine] frame callback error:', err); }
    });

    // 4. Determine whether loop can sleep (e.g. no continuous subscribers and pointer/scroll stationary)
    const hasActiveSubscribers = this.frameSubscribers.size > 0;
    const isInteracting = Math.hypot(dx, dy) > 0.1 || this.scroll.isScrolling;

    if (hasActiveSubscribers || isInteracting) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.stopLoop();
    }
  };

  /**
   * Subscribe a callback to the centralized requestAnimationFrame loop.
   * Returns an unsubscribe function.
   */
  subscribeFrame(callback) {
    this.frameSubscribers.add(callback);
    this.ensureRunning();
    return () => {
      this.frameSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe a callback to coalesced pointer updates.
   */
  subscribePointer(callback) {
    this.pointerSubscribers.add(callback);
    return () => {
      this.pointerSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe a callback to coalesced scroll updates.
   */
  subscribeScroll(callback) {
    this.scrollSubscribers.add(callback);
    return () => {
      this.scrollSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe a callback to debounced resize events.
   */
  subscribeResize(callback) {
    this.resizeSubscribers.add(callback);
    return () => {
      this.resizeSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe a callback to Page Visibility changes (tab focus/blur).
   */
  subscribeVisibility(callback) {
    this.visibilitySubscribers.add(callback);
    return () => {
      this.visibilitySubscribers.delete(callback);
    };
  }
}

// Global Singleton Instance
export const motionEngine = new MotionEngine();
