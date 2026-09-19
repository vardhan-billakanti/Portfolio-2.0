/**
 * PORTFOLIO 2.0 — 3D ORBITAL TECHNOLOGY ECOSYSTEM ENGINE
 * Rebuilt strictly based on the original old portfolio Toolkit orbital system.
 * Features:
 * - 4 Spatial elliptical orbits with independent angular speeds and alternating directions
 * - 31 Floating technology node chips with authentic real SVG icons
 * - Natural 3D depth perspective & layering (foreground vs background passing)
 * - Restrained desktop mouse parallax with smooth inertial damping
 * - Interactive cross-highlighting with left tool directory
 * - Viewport-aware RAF loop (IntersectionObserver + visibilitychange for 0% idle overhead)
 * - Reduced-motion accessibility support
 */

import { TOOLKIT_TECHNOLOGIES } from '../data/toolkit-data.js';

export class ToolkitOrbitEngine {
  constructor(viewportEl, nodesLayerEl, svgTracksEl, techCoreEl) {
    this.viewport = viewportEl;
    this.nodesLayer = nodesLayerEl;
    this.svgTracks = svgTracksEl;
    this.techCore = techCoreEl;

    // 4 Elliptical Orbit Rings (Expanded ~12% vertically for balanced vertical footprint)
    this.RINGS = [
      { rx: 92,  ry: 70,  speed:  0.00062, dir:  1 }, // Ring 0 (Inner): 4 tools
      { rx: 152, ry: 114, speed:  0.00046, dir: -1 }, // Ring 1: 8 tools
      { rx: 206, ry: 155, speed:  0.00034, dir:  1 }, // Ring 2: 9 tools
      { rx: 254, ry: 190, speed:  0.00024, dir: -1 }  // Ring 3 (Outer): 10 tools
    ];

    this.svgRingEls = [
      document.getElementById('orbitRing1'),
      document.getElementById('orbitRing2'),
      document.getElementById('orbitRing3'),
      document.getElementById('orbitRing4')
    ];

    // Node state objects
    this.nodeObjects = [];
    this.activeToolName = null;

    // Smooth scaling easing constants
    this.TARGET_SCALE_HOVER = 1.25;
    this.TARGET_SCALE_ACTIVE = 1.35;
    this.SCALE_EASE = 0.18;
    this.SCALE_EPSILON = 0.002;

    // Viewport & Projection Dimensions
    this.vw = 540;
    this.vh = 540;
    this.scaleX = 1;
    this.scaleY = 1;
    this.cx = 270;
    this.cy = 270;

    // Mouse Parallax States (Desktop only)
    this.mouseX = 0;
    this.mouseY = 0;
    this.currMouseX = 0;
    this.currMouseY = 0;
    this.hasFinePointer = false;

    // RAF Animation Loop Controls
    this.rafId = null;
    this.isRunning = false;
    this.lastTs = 0;
    this.isSectionVisible = false;
    this.isDocVisible = typeof document !== 'undefined' ? !document.hidden : true;
    this.prefersReducedMotion = false;

    this.init();
  }

  init() {
    if (!this.viewport || !this.nodesLayer) return;

    this.prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.hasFinePointer = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.buildNodes();
    this.updateDimensions();
    this.setupResizeObserver();
    this.setupMouseParallax();
    this.setupVisibilityObservers();

    // Initial render
    this.renderFrame(0);

    // Start loop if visible
    if (!this.prefersReducedMotion && this.isSectionVisible) {
      this.start();
    }
  }

  buildNodes() {
    this.nodesLayer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    this.nodeObjects = [];

    // Count tools per ring
    const ringCounts = [0, 0, 0, 0];
    TOOLKIT_TECHNOLOGIES.forEach(t => {
      if (t.ring >= 0 && t.ring <= 3) ringCounts[t.ring]++;
    });

    const ringSlot = [0, 0, 0, 0];

    TOOLKIT_TECHNOLOGIES.forEach(tool => {
      const r = tool.ring;
      const idx = ringSlot[r]++;
      const total = ringCounts[r];

      // Calculate initial orbital phase angle evenly spaced with ring offset
      const angle = ((idx / total) * 2 * Math.PI) + (r * Math.PI * 0.42);

      // Create DOM chip
      const chip = document.createElement('div');
      chip.className = 'orbit-node-chip';
      chip.setAttribute('data-node-name', tool.name);
      chip.setAttribute('data-ring', r);

      const logoImg = tool.icon
        ? `<img src="${tool.icon}" class="node-logo-img" alt="${tool.name}" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size:12px;line-height:1;color:#ff6420\\'>●</span>';">`
        : `<span style="font-size:12px;line-height:1;color:#ff6420">●</span>`;

      chip.innerHTML = `${logoImg}<span>${tool.name}</span>`;

      // Interactive hover on the chip directly
      chip.addEventListener('mouseenter', () => {
        this.setDirectNodeHover(tool.name, true);
      }, { passive: true });

      chip.addEventListener('mouseleave', () => {
        this.setDirectNodeHover(tool.name, false);
      }, { passive: true });

      fragment.appendChild(chip);

      this.nodeObjects.push({
        el: chip,
        name: tool.name,
        ring: r,
        angle: angle,
        scale: 1,
        targetScale: 1,
        isDirectHovered: false,
        isActive: false,
        lastZ: 0
      });
    });

    this.nodesLayer.appendChild(fragment);
  }

  updateDimensions() {
    this.vw = this.viewport.clientWidth || 540;
    this.vh = this.viewport.clientHeight || 540;

    // Viewport coordinate center and responsive scale relative to 540px base design
    const s = Math.min(this.vw / 540, this.vh / 540);
    this.scaleX = s;
    this.scaleY = s;
    this.cx = this.vw / 2;
    this.cy = this.vh / 2;

    this.renderFrame(0);
  }

  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        this.updateDimensions();
      });
      ro.observe(this.viewport);
    }
  }

  setupMouseParallax() {
    if (!this.hasFinePointer) return;

    const onMouseMove = (e) => {
      const rect = this.viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalized coordinates: -1 to +1
      this.mouseX = ((x / rect.width) * 2 - 1);
      this.mouseY = ((y / rect.height) * 2 - 1);
    };

    const onMouseLeave = () => {
      this.mouseX = 0;
      this.mouseY = 0;
    };

    this.viewport.addEventListener('mousemove', onMouseMove, { passive: true });
    this.viewport.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }

  setupVisibilityObservers() {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        this.isSectionVisible = entries[0].isIntersecting;
        if (this.isSectionVisible && this.isDocVisible && !this.prefersReducedMotion) {
          this.start();
        } else {
          this.stop();
        }
      }, { threshold: 0.05, rootMargin: '100px 0px' });

      io.observe(this.viewport);
    } else {
      this.isSectionVisible = true;
      if (!this.prefersReducedMotion) this.start();
    }

    document.addEventListener('visibilitychange', () => {
      this.isDocVisible = !document.hidden;
      if (this.isDocVisible && this.isSectionVisible && !this.prefersReducedMotion) {
        this.start();
      } else {
        this.stop();
      }
    }, { passive: true });
  }

  setDirectNodeHover(toolName, isHovered) {
    const node = this.nodeObjects.find(n => n.name === toolName);
    if (!node) return;

    node.isDirectHovered = isHovered;
    if (isHovered) {
      node.targetScale = this.TARGET_SCALE_HOVER;
    } else {
      node.targetScale = node.isActive ? this.TARGET_SCALE_ACTIVE : 1;
    }
  }

  highlightNode(toolName) {
    this.activeToolName = toolName;
    this.viewport.classList.add('is-active');

    let activeRing = -1;

    for (let i = 0; i < this.nodeObjects.length; i++) {
      const node = this.nodeObjects[i];
      const isMatch = node.name === toolName;

      node.isActive = isMatch;
      node.el.classList.toggle('active', isMatch);
      node.targetScale = isMatch ? this.TARGET_SCALE_ACTIVE : 1;

      if (isMatch) {
        activeRing = node.ring;
      }
    }

    for (let r = 0; r < this.svgRingEls.length; r++) {
      const ringEl = this.svgRingEls[r];
      if (ringEl) {
        ringEl.classList.toggle('ring-active', r === activeRing);
      }
    }
  }

  resetHighlight() {
    this.activeToolName = null;
    this.viewport.classList.remove('is-active');

    for (let i = 0; i < this.nodeObjects.length; i++) {
      const node = this.nodeObjects[i];
      node.isActive = false;
      node.el.classList.remove('active');
      node.targetScale = node.isDirectHovered ? this.TARGET_SCALE_HOVER : 1;
    }

    for (let r = 0; r < this.svgRingEls.length; r++) {
      const ringEl = this.svgRingEls[r];
      if (ringEl) {
        ringEl.classList.remove('ring-active');
      }
    }
  }

  renderFrame(dt) {
    // 1. Smooth mouse parallax damping (inertial lerp)
    if (this.hasFinePointer) {
      this.currMouseX += (this.mouseX - this.currMouseX) * 0.08;
      this.currMouseY += (this.mouseY - this.currMouseY) * 0.08;
    }

    const parallaxX = this.currMouseX * 14;
    const parallaxY = this.currMouseY * 10;
    const rotX = -this.currMouseY * 4.5;
    const rotY = this.currMouseX * 5.5;

    // Apply 3D perspective parallax to viewport surface
    if (this.hasFinePointer && (Math.abs(parallaxX) > 0.1 || Math.abs(parallaxY) > 0.1)) {
      this.nodesLayer.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      if (this.svgTracks) {
        this.svgTracks.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }
      if (this.techCore) {
        this.techCore.style.transform = `translate(-50%, -50%) translate3d(${(-parallaxX * 0.35).toFixed(1)}px, ${(-parallaxY * 0.35).toFixed(1)}px, 0)`;
      }
    }

    // 2. Animate and project each satellite node along its elliptical orbit
    for (let i = 0; i < this.nodeObjects.length; i++) {
      const node = this.nodeObjects[i];
      const ring = this.RINGS[node.ring];

      // Advance angular position with delta-time
      if (dt > 0 && !this.prefersReducedMotion) {
        node.angle += ring.speed * ring.dir * dt;
      }

      // Smooth target scale interpolation
      const diff = node.targetScale - node.scale;
      if (Math.abs(diff) > this.SCALE_EPSILON) {
        node.scale += diff * this.SCALE_EASE;
      } else {
        node.scale = node.targetScale;
      }

      // Elliptical coordinate calculation with responsive scaling
      const rawX = ring.rx * Math.cos(node.angle);
      const rawY = ring.ry * Math.sin(node.angle);

      const px = rawX * this.scaleX;
      const py = rawY * this.scaleY;

      // 3D Depth Modulation:
      // When py > 0 (bottom of ellipse, foreground): node is closer to camera -> higher z-index, slight depth magnification
      // When py < 0 (top of ellipse, background): node passes behind TECH CORE (core z-index is 35)
      const depthRatio = rawY / ring.ry; // -1 (deep background) to +1 (immediate foreground)
      const depthScale = 1 + (depthRatio * 0.08); // 0.92 to 1.08
      const finalScale = node.scale * depthScale;

      let newZ = 15;
      if (node.isActive) {
        newZ = 100;
      } else if (node.isDirectHovered) {
        newZ = 95;
      } else if (depthRatio > 0.05) {
        // Foreground: in front of TECH CORE (which is z-index 35)
        newZ = 40 + Math.round(depthRatio * 15);
      } else {
        // Background: behind TECH CORE
        newZ = 10 + Math.round((depthRatio + 1) * 10);
      }

      if (node.lastZ !== newZ) {
        node.el.style.zIndex = newZ;
        node.lastZ = newZ;
      }

      const screenX = this.cx + px;
      const screenY = this.cy + py;

      // Hardware-accelerated 3D transform projection
      node.el.style.transform = 
        `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
    }
  }

  tick = (ts) => {
    if (!this.isRunning) return;

    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(ts - this.lastTs, 32);
    this.lastTs = ts;

    this.renderFrame(dt);
    this.rafId = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.isRunning || this.prefersReducedMotion) return;
    this.isRunning = true;
    this.lastTs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTs = 0;
  }

  destroy() {
    this.stop();
    this.nodeObjects = [];
  }
}
