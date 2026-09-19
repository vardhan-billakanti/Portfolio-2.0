/**
 * PORTFOLIO 2.0 — LORVEN ENTERPRISE 3D SCROLL-STORYTELLING ENGINE
 * 
 * Perfect Lorven Brand Symbol with Full-Section Continuous Downward Scroll Travel
 * Key Corrections:
 * - NO TOP CUT-OFF: Corrected camera framing and initial Y-position so the complete
 *   3D hexagonal structure is 100% visible below the navbar from the first frame.
 * - FULL-SECTION VISIBILITY: Logo remains active and solid (no premature fade-out)
 *   throughout the ENTIRE Lorven section (heading -> 4 capabilities -> narrative -> CTA).
 * - COMPLETE SECTION SCROLL RANGE: Scroll progress is mapped precisely across the total
 *   scrollable distance of the Lorven section (rect.top = 0 to rect.bottom = vh).
 * - PHYSICAL DOWNWARD TRAVEL: 3D symbol travels smoothly from upper-right beside the hero,
 *   down through the capabilities stream, into the lower narrative/CTA region.
 * - PRESERVED LOGO FIDELITY: Gold chamfered hexagon, vibrant cyan-to-cobalt-blue bars,
 *   gold upward arrow (↗), and deep black interior are 100% preserved.
 */

import { motionEngine } from '../core/motion-engine.js';

export class LorvenSectionController {
  constructor() {
    this.section = document.getElementById('lorven');
    this.canvas = document.getElementById('lorven-3d-canvas');
    if (!this.section || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    // Viewport & Display metrics
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.dpr = motionEngine.dpr;
    this.isMobile = false;
    this.prefersReducedMotion = false;

    // Cached layout geometry (zero getBoundingClientRect inside scroll & render frames)
    this.cachedSectionTop = 0;
    this.cachedSectionHeight = 0;
    this.cachedTotalScrollable = 1;
    this.cachedCanvasRect = { left: 0, top: 0, width: 0, height: 0 };
    this.unsubscribers = [];

    // Scroll progress tracking (0.0 to 1.0 across the entire Lorven section)
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.isIntersecting = false;
    this.rafId = null;

    // Damped mouse micro-parallax (desktop only)
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.mouseParallaxX = 0;
    this.mouseParallaxY = 0;

    // Subtle Hover Interaction State
    this.isLogoHovered = false;
    this.hoverWeight = 0;
    this.targetHoverWeight = 0;
    this.hoverTiltX = 0;
    this.hoverTiltY = 0;
    this.targetHoverTiltX = 0;
    this.targetHoverTiltY = 0;

    // Directional Lighting Vector (Top-right key light matching the golden sheen in Lorven logo)
    const lx = 0.62, ly = -0.68, lz = 1.15;
    const len = Math.hypot(lx, ly, lz);
    this.lightDir = { x: lx / len, y: ly / len, z: lz / len };

    // Geometry caches
    this.polygons = [];
    this.wireEdges = [];

    this.init();
  }

  init() {
    // Accessibility check
    this.prefersReducedMotion = motionEngine.prefersReducedMotion;

    this.handleResize();

    // Subscribe to MotionEngine debounced resize
    this.unsubscribers.push(
      motionEngine.subscribeResize(() => this.handleResize())
    );

    // Subscribe to MotionEngine coalesced scroll
    this.unsubscribers.push(
      motionEngine.subscribeScroll((s) => this.handleScroll(s.y))
    );

    // Subscribe to MotionEngine tab visibility
    this.unsubscribers.push(
      motionEngine.subscribeVisibility((visible) => {
        if (visible && this.isIntersecting) {
          if (!this.rafId) this.animate();
        } else {
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        }
      })
    );

    // Desktop micro-parallax via MotionEngine pointer subscriber
    this.unsubscribers.push(
      motionEngine.subscribePointer((p) => {
        if (this.isMobile || this.prefersReducedMotion || !this.isIntersecting) return;
        this.targetMouseX = p.normX * 0.05; // gentle max 3 degrees
        this.targetMouseY = p.normY * 0.05;

        // 3D Logo hit-testing for gentle hover floating interaction
        const rect = this.cachedCanvasRect;
        const mx = p.x - rect.left;
        const my = p.y - rect.top;

        const prog = this.currentProgress;
        const stageYOffset = -this.height * 0.07 + prog * (this.height * 0.15);
        const horizontalCurve = Math.sin(prog * Math.PI);
        const transX = this.isMobile 
          ? 0 
          : (this.width * (0.02 + horizontalCurve * 0.02 - prog * 0.01));
        const logoX = this.centerX + transX;
        const logoY = this.centerY + stageYOffset;

        const dist = Math.hypot(mx - logoX, my - logoY);
        const hitRadius = (this.baseRadius || 240) * 1.05;

        if (dist <= hitRadius && mx >= 0 && mx <= this.width && my >= 0 && my <= this.height) {
          this.isLogoHovered = true;
          this.targetHoverWeight = 1.0;
          this.targetHoverTiltX = (mx - logoX) / hitRadius;
          this.targetHoverTiltY = (my - logoY) / hitRadius;
        } else {
          this.isLogoHovered = false;
          this.targetHoverWeight = 0.0;
          this.targetHoverTiltX = 0;
          this.targetHoverTiltY = 0;
        }
      })
    );

    this.canvas.addEventListener('mouseleave', () => {
      this.isLogoHovered = false;
      this.targetHoverWeight = 0.0;
      this.targetHoverTiltX = 0;
      this.targetHoverTiltY = 0;
    }, { passive: true });

    // Intersection Observer to halt RAF loop when section is outside viewport (0% CPU idle)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isIntersecting = entry.isIntersecting && motionEngine.isVisible;
          if (this.isIntersecting) {
            this.handleScroll();
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
      }, {
        root: null,
        rootMargin: '100px 0px 100px 0px',
        threshold: 0
      });
      observer.observe(this.section);
    } else {
      this.isIntersecting = true;
      this.animate();
    }

    // Build 3D Geometry Model
    this.build3DGeometry();

    // Initial scroll measurement & render
    this.handleScroll();
    this.currentProgress = this.targetProgress;
    this.render();
  }

  measureSection() {
    if (!this.section) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rect = this.section.getBoundingClientRect();
    this.cachedSectionTop = rect.top + scrollY;
    this.cachedSectionHeight = rect.height || this.section.offsetHeight;
    this.cachedTotalScrollable = Math.max(1, this.cachedSectionHeight - window.innerHeight);

    const canvasRect = this.canvas.getBoundingClientRect();
    this.cachedCanvasRect = {
      left: canvasRect.left,
      top: canvasRect.top,
      width: canvasRect.width,
      height: canvasRect.height
    };
  }

  handleResize() {
    this.measureSection();
    this.width = this.cachedCanvasRect.width || window.innerWidth;
    this.height = this.cachedCanvasRect.height || window.innerHeight;
    this.isMobile = window.innerWidth < 768;
    this.dpr = motionEngine.dpr;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.build3DGeometry();
    this.handleScroll();
    this.render();
  }

  /**
   * Calculates scroll progress across the ENTIRE Lorven section.
   * Progress = 0.0 when top of Lorven enters/aligns with viewport top.
   * Progress = 1.0 when bottom of Lorven aligns with viewport bottom.
   * Zero layout reflows during active scroll.
   */
  handleScroll(scrollY = window.scrollY || window.pageYOffset || 0) {
    if (!this.section) return;
    const currentDist = scrollY - this.cachedSectionTop;
    const rawProgress = currentDist / this.cachedTotalScrollable;
    this.targetProgress = Math.max(0, Math.min(1, rawProgress));
  }

  /**
   * Constructs the 3D Lorven Hexagonal Brand Symbol.
   * Preserves exact visual fidelity:
   * 1. Outer Beveled Gold Hexagon Ring (chamfer ridges, beveled facets, rear extrusion)
   * 2. Recessed Concentric Hexagon Layer (interior bevel)
   * 3. Three Ascending Internal Columns: Vibrant Cyan-to-Blue Gradient Bars
   * 4. Central Rising Growth Arrow: Radiant Gold Chevron Path & Arrowhead (↗)
   */
  build3DGeometry() {
    this.polygons = [];
    this.wireEdges = [];

    // Sizing calibrated for sticky 3D companion stage
    this.baseRadius = this.isMobile 
      ? Math.min(this.width, this.height) * 0.30
      : Math.min(this.width, this.height) * 0.36;
    const baseRadius = this.baseRadius;

    const rOut = baseRadius;
    const rMid = baseRadius * 0.80; // Chamfer ridge
    const rIn = baseRadius * 0.60;  // Inner aperture
    const zRidge = baseRadius * 0.22; // Chiseled forward ridge
    const zDepth = -baseRadius * 0.26; // Rear extrusion depth

    // 6-sided Hexagon Vertices (flat horizontal top & bottom, pointed sides matching Lorven mark)
    // Angles: 0, 60, 120, 180, 240, 300 degrees
    const getHexPoints = (radius, z) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60) * (Math.PI / 180);
        pts.push({
          x: radius * Math.cos(rad),
          y: radius * Math.sin(rad),
          z: z
        });
      }
      return pts;
    };

    const outPts = getHexPoints(rOut, 0);
    const midPts = getHexPoints(rMid, zRidge);
    const inPts = getHexPoints(rIn, zRidge * 0.35);
    const rearOutPts = getHexPoints(rOut, zDepth);
    const rearInPts = getHexPoints(rIn, zDepth);

    // 1. FRONT BEVELED GOLD FACETS: Outer chamfers (out -> mid)
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      this.polygons.push({
        type: 'gold-chamfer-out',
        vertices: [outPts[i], outPts[next], midPts[next], midPts[i]],
        baseColor: { r: 165, g: 125, b: 35 },
        diffuseColor: { r: 245, g: 195, b: 55 },
        specularColor: { r: 255, g: 245, b: 170 },
        specularPower: 14
      });
      this.wireEdges.push([midPts[i], midPts[next], 'gold']);
    }

    // 2. FRONT BEVELED GOLD FACETS: Inner slope (mid -> in)
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      this.polygons.push({
        type: 'gold-chamfer-in',
        vertices: [midPts[i], midPts[next], inPts[next], inPts[i]],
        baseColor: { r: 130, g: 95, b: 25 },
        diffuseColor: { r: 215, g: 165, b: 45 },
        specularColor: { r: 255, g: 235, b: 140 },
        specularPower: 12
      });
      this.wireEdges.push([inPts[i], inPts[next], 'gold-subtle']);
    }

    // 3. LATERAL EXTRUSION WALLS: Outer thickness (out -> rearOut)
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      this.polygons.push({
        type: 'gold-wall-out',
        vertices: [outPts[i], rearOutPts[i], rearOutPts[next], outPts[next]],
        baseColor: { r: 90, g: 65, b: 18 },
        diffuseColor: { r: 160, g: 115, b: 30 },
        specularColor: { r: 230, g: 190, b: 90 },
        specularPower: 8
      });
    }

    // 4. INNER APERTURE WALLS: Inner thickness (in -> rearIn)
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      this.polygons.push({
        type: 'gold-wall-in',
        vertices: [inPts[i], inPts[next], rearInPts[next], rearInPts[i]],
        baseColor: { r: 65, g: 45, b: 12 },
        diffuseColor: { r: 120, g: 85, b: 22 },
        specularColor: { r: 195, g: 155, b: 70 },
        specularPower: 8
      });
    }

    // 5. RECESSED SECONDARY CONCENTRIC RING (Architectural depth)
    const rRecOut = rIn * 0.88;
    const rRecIn = rIn * 0.70;
    const zRec = zDepth * 0.60;
    const recOutPts = getHexPoints(rRecOut, zRec);
    const recInPts = getHexPoints(rRecIn, zRec);

    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      this.polygons.push({
        type: 'gold-recessed-ring',
        vertices: [recOutPts[i], recOutPts[next], recInPts[next], recInPts[i]],
        baseColor: { r: 85, g: 60, b: 16 },
        diffuseColor: { r: 150, g: 110, b: 28 },
        specularColor: { r: 220, g: 180, b: 80 },
        specularPower: 10
      });
      this.wireEdges.push([recOutPts[i], recOutPts[next], 'gold-amber']);
    }

    // 6. THREE ASCENDING INTERNAL COLUMNS (VIBRANT CYAN / BLUE GRADIENT)
    const barW = baseRadius * 0.088;
    const gap = baseRadius * 0.040;
    const startX = -baseRadius * 0.17;
    const baseY = baseRadius * 0.28;
    const heights = [baseRadius * 0.20, baseRadius * 0.32, baseRadius * 0.45];
    const zCol = zRidge * 0.40;
    const bD = zCol * 0.55;

    for (let b = 0; b < 3; b++) {
      const bx = startX + b * (barW + gap);
      const h = heights[b];
      const by = baseY - h;
      const bz = zCol;

      // Front face: Vibrant Cyan / Azure Blue
      this.polygons.push({
        type: 'cyan-blue-bar-front',
        vertices: [
          { x: bx, y: by, z: bz },
          { x: bx + barW, y: by, z: bz },
          { x: bx + barW, y: baseY, z: bz },
          { x: bx, y: baseY, z: bz }
        ],
        baseColor: { r: 24, g: 85, b: 195 },     // Cobalt blue base
        diffuseColor: { r: 0, g: 215, b: 255 },    // Radiant cyan-blue
        specularColor: { r: 180, g: 245, b: 255 }, // Crisp cyan highlight
        specularPower: 16,
        isCyan: true
      });

      // Top cap face: Bright Cyan Gleam
      this.polygons.push({
        type: 'cyan-bar-top',
        vertices: [
          { x: bx, y: by, z: bz - bD },
          { x: bx + barW, y: by, z: bz - bD },
          { x: bx + barW, y: by, z: bz },
          { x: bx, y: by, z: bz }
        ],
        baseColor: { r: 0, g: 175, b: 230 },
        diffuseColor: { r: 50, g: 235, b: 255 },
        specularColor: { r: 220, g: 255, b: 255 },
        specularPower: 18,
        isCyan: true
      });

      // Side depth face
      this.polygons.push({
        type: 'cyan-bar-side',
        vertices: [
          { x: bx + barW, y: by, z: bz },
          { x: bx + barW, y: by, z: bz - bD },
          { x: bx + barW, y: baseY, z: bz - bD },
          { x: bx + barW, y: baseY, z: bz }
        ],
        baseColor: { r: 14, g: 55, b: 140 },
        diffuseColor: { r: 20, g: 120, b: 210 },
        specularColor: { r: 140, g: 220, b: 255 },
        specularPower: 10,
        isCyan: true
      });

      this.wireEdges.push([
        { x: bx, y: by, z: bz },
        { x: bx + barW, y: by, z: bz },
        'cyan-bright'
      ]);
    }

    // 7. CENTRAL UPWARD GROWTH ARROW (VIBRANT GOLD CHEVRON & ARROWHEAD ↗)
    const arrowPts = [
      { x: -baseRadius * 0.34, y: baseRadius * 0.18, z: zRidge * 0.85 },
      { x: -baseRadius * 0.13, y: baseRadius * 0.05, z: zRidge * 0.95 },
      { x: baseRadius * 0.06,  y: -baseRadius * 0.12, z: zRidge * 1.05 },
      { x: baseRadius * 0.28,  y: -baseRadius * 0.28, z: zRidge * 1.20 }
    ];

    const aThick = baseRadius * 0.045;
    for (let s = 0; s < arrowPts.length - 1; s++) {
      const p1 = arrowPts[s];
      const p2 = arrowPts[s + 1];
      this.polygons.push({
        type: 'gold-growth-arrow',
        vertices: [
          { x: p1.x, y: p1.y - aThick, z: p1.z },
          { x: p2.x, y: p2.y - aThick, z: p2.z },
          { x: p2.x, y: p2.y + aThick, z: p2.z },
          { x: p1.x, y: p1.y + aThick, z: p1.z }
        ],
        baseColor: { r: 185, g: 140, b: 35 },
        diffuseColor: { r: 255, g: 215, b: 50 },
        specularColor: { r: 255, g: 250, b: 180 },
        specularPower: 18
      });
      this.wireEdges.push([p1, p2, 'gold-arrow']);
    }

    // Arrowhead barb
    const tip = arrowPts[arrowPts.length - 1];
    const barbSize = baseRadius * 0.11;
    this.polygons.push({
      type: 'gold-arrowhead',
      vertices: [
        { x: tip.x + barbSize * 0.45, y: tip.y - barbSize * 0.45, z: tip.z + 6 },
        { x: tip.x - barbSize * 0.85, y: tip.y - barbSize * 0.10, z: tip.z },
        { x: tip.x - barbSize * 0.10, y: tip.y + barbSize * 0.85, z: tip.z }
      ],
      baseColor: { r: 200, g: 155, b: 40 },
      diffuseColor: { r: 255, g: 225, b: 60 },
      specularColor: { r: 255, g: 255, b: 195 },
      specularPower: 20
    });
  }

  animate() {
    if (!this.isIntersecting) {
      this.rafId = null;
      return;
    }

    // Smooth progress interpolation (damped lerp for fluid physical travel)
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.08;

    // Smooth mouse parallax interpolation
    this.mouseParallaxX += (this.targetMouseX - this.mouseParallaxX) * 0.05;
    this.mouseParallaxY += (this.targetMouseY - this.mouseParallaxY) * 0.05;

    // Smooth hover weight interpolation (very gentle ease in/out)
    this.hoverWeight += (this.targetHoverWeight - this.hoverWeight) * 0.045;

    // Smooth hover tilt interpolation
    this.hoverTiltX += (this.targetHoverTiltX - this.hoverTiltX) * 0.05;
    this.hoverTiltY += (this.targetHoverTiltY - this.hoverTiltY) * 0.05;

    this.render();

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const p = this.currentProgress;

    // =========================================================================
    // CHOREOGRAPHED DOWNWARD SCROLL JOURNEY (ZERO CUT-OFF, FULL VISIBILITY)
    // =========================================================================
    // START (p = 0.0):
    // - Anchored gracefully on upper-right beside the main heading.
    // - startY is calculated so top of hexagon is comfortably 24-36px below navbar.
    // - Complete object is 100% visible, not clipped by top edge or navbar.
    // MIDDLE (p = 0.5):
    // - Travels downward into the center alongside capability content.
    // - Rotates and subtly shifts depth.
    // END (p = 1.0):
    // - Descends into lower portion beside narrative & CTA.
    // - Remains solid and visible until Lorven section actually ends.
    // =========================================================================
    const baseRadius = this.baseRadius || (this.isMobile 
      ? Math.min(this.width, this.height) * 0.30 
      : Math.min(this.width, this.height) * 0.36);

    let rotX, rotY, rotZ, scale, transX, transZ, cy;

    if (this.prefersReducedMotion) {
      rotX = 0.10;
      rotY = 0.20;
      rotZ = 0.02;
      scale = 1.0;
      transZ = 0;
      transX = 0;
      cy = (this.centerY - this.height * 0.04 + p * (this.height * 0.08)) * this.dpr;
    } else {
      // Very slow, gentle floating oscillation (frequency ~0.75 rad/s, ~8.4s gentle period)
      const t = performance.now() * 0.001;
      const floatY = Math.sin(t * 0.75) * 5.5;       // gentle 5.5px vertical breath
      const floatX = Math.cos(t * 0.55) * 2.5;       // gentle 2.5px horizontal drift
      const floatTiltY = Math.sin(t * 0.65) * 0.030; // gentle 1.7° yaw oscillation
      const floatTiltX = Math.cos(t * 0.50) * 0.020; // gentle 1.1° pitch oscillation

      // Subtle cursor tracking tilt (max ~2.2°)
      const cursorTiltY = this.hoverTiltX * 0.038;
      const cursorTiltX = -this.hoverTiltY * 0.030;

      // Base scroll-driven rotation
      const baseRotY = -0.30 + p * 0.96;
      const baseRotX = 0.16 - p * 0.26;
      const baseRotZ = -0.06 + p * 0.16;

      // Blended rotation: scroll baseline + gentle hover motion
      rotY = baseRotY + this.mouseParallaxX + (cursorTiltY + floatTiltY) * this.hoverWeight;
      rotX = baseRotX + this.mouseParallaxY + (cursorTiltX + floatTiltX) * this.hoverWeight;
      rotZ = baseRotZ + (floatX * 0.0015) * this.hoverWeight;

      // Dynamic scale: steady & prominent, gently swells mid-journey, settles at end
      const scaleCurve = Math.sin(p * Math.PI);
      scale = 0.94 + scaleCurve * 0.08;

      // Depth translation: brings the structure subtly closer during mid-story
      transZ = -30 + scaleCurve * 40;

      // In-stage vertical position + gentle hover float:
      const stageYOffset = -this.height * 0.07 + p * (this.height * 0.15) + (floatY * this.hoverWeight);
      cy = (this.centerY + stageYOffset) * this.dpr;

      // In-stage horizontal path + gentle hover drift:
      const horizontalCurve = Math.sin(p * Math.PI);
      const baseTransX = this.isMobile 
        ? 0 
        : (this.width * (0.02 + horizontalCurve * 0.02 - p * 0.01));
      transX = baseTransX + (floatX * this.hoverWeight);
    }

    // Perspective projection parameters
    const fov = 920;
    const cx = (this.centerX + transX) * this.dpr;

    // Rotation Matrix Precomputations
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

    const transformPoint = (pt) => {
      let x = pt.x * scale;
      let y = pt.y * scale;
      let z = pt.z * scale + transZ;

      // Rotate Y
      let x1 = x * cosY + z * sinY;
      let z1 = -x * sinY + z * cosY;

      // Rotate X
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      // Rotate Z
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;
      let z3 = z2;

      // Perspective Projection
      const pScale = fov / (fov + z3);
      return {
        x: cx + x3 * pScale * this.dpr,
        y: cy + y3 * pScale * this.dpr,
        z: z3,
        pScale
      };
    };

    // Transform and depth-sort all polygons (Painter's Algorithm)
    const renderedPolys = [];

    for (let i = 0; i < this.polygons.length; i++) {
      const poly = this.polygons[i];
      const projected = poly.vertices.map(transformPoint);

      let avgZ = 0;
      for (let v = 0; v < projected.length; v++) {
        avgZ += projected[v].z;
      }
      avgZ /= projected.length;

      // Normal vector calculation in 3D for directional lighting
      const v0 = poly.vertices[0];
      const v1 = poly.vertices[1];
      const v2 = poly.vertices[2];

      const ux = v1.x - v0.x, uy = v1.y - v0.y, uz = v1.z - v0.z;
      const vx = v2.x - v0.x, vy = v2.y - v0.y, vz = v2.z - v0.z;
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen; ny /= nLen; nz /= nLen;

      let nx1 = nx * cosY + nz * sinY;
      let nz1 = -nx * sinY + nz * cosY;
      let ny2 = ny * cosX - nz1 * sinX;
      let nz2 = ny * sinX + nz1 * cosX;
      let rnx = nx1 * cosZ - ny2 * sinZ;
      let rny = nx1 * sinZ + ny2 * cosZ;
      let rnz = nz2;

      renderedPolys.push({
        poly,
        projected,
        avgZ,
        normal: { x: rnx, y: rny, z: rnz }
      });
    }

    // Sort furthest to closest
    renderedPolys.sort((a, b) => a.avgZ - b.avgZ);

    // =========================================================================
    // OPACITY LOGIC:
    // Solid & 100% active throughout the ENTIRE Lorven section [0, 1].
    // Does NOT prematurely vanish at 0.8.
    // Fades smoothly ONLY when Lorven section is actually scrolling off-screen.
    // =========================================================================
    let masterOpacity = 1.0;
    if (this.cachedSectionHeight > 0) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const rectBottom = this.cachedSectionTop + this.cachedSectionHeight - scrollY;
      const vh = window.innerHeight;
      if (rectBottom < vh) {
        // Naturally fades out only as the Lorven section finishes and leaves the viewport
        masterOpacity = Math.max(0, rectBottom / vh);
      }
    }
    const baseAlpha = (this.isMobile ? 0.60 : 0.95) * masterOpacity;

    // Render Facets with Rich Gold & Cyan-Blue Fidelity
    for (let i = 0; i < renderedPolys.length; i++) {
      const item = renderedPolys[i];
      const proj = item.projected;
      const norm = item.normal;
      const cfg = item.poly;

      // Directional diffuse calculation
      const dotL = Math.max(0, norm.x * this.lightDir.x + norm.y * this.lightDir.y + norm.z * this.lightDir.z);

      // Specular reflection calculation
      const rx = 2 * dotL * norm.x - this.lightDir.x;
      const ry = 2 * dotL * norm.y - this.lightDir.y;
      const rz = 2 * dotL * norm.z - this.lightDir.z;
      const dotV = Math.max(0, rz);
      const spec = Math.pow(dotV, cfg.specularPower || 12);

      // Color composite:
      let r, g, b;
      if (cfg.isCyan) {
        r = Math.min(255, Math.round(cfg.baseColor.r + dotL * (cfg.diffuseColor.r - cfg.baseColor.r) + spec * 200));
        g = Math.min(255, Math.round(cfg.baseColor.g + dotL * (cfg.diffuseColor.g - cfg.baseColor.g) + spec * 230));
        b = Math.min(255, Math.round(cfg.baseColor.b + dotL * (cfg.diffuseColor.b - cfg.baseColor.b) + spec * 255));
      } else {
        r = Math.min(255, Math.round(cfg.baseColor.r + dotL * (cfg.diffuseColor.r - cfg.baseColor.r) + spec * 170));
        g = Math.min(255, Math.round(cfg.baseColor.g + dotL * (cfg.diffuseColor.g - cfg.baseColor.g) + spec * 140));
        b = Math.min(255, Math.round(cfg.baseColor.b + dotL * (cfg.diffuseColor.b - cfg.baseColor.b) + spec * 80));
      }

      // Draw Polygon Path
      ctx.beginPath();
      ctx.moveTo(proj[0].x, proj[0].y);
      for (let v = 1; v < proj.length; v++) {
        ctx.lineTo(proj[v].x, proj[v].y);
      }
      ctx.closePath();

      // Solid, high-contrast fill
      const polyAlpha = baseAlpha * (0.82 + dotL * 0.18);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${polyAlpha})`;
      ctx.fill();

      // Sharp edge stroke to define dimensional facets
      if (cfg.isCyan) {
        ctx.strokeStyle = `rgba(56, 215, 255, ${baseAlpha * (0.5 + spec * 0.5)})`;
      } else {
        const edgeR = Math.min(255, r + 40);
        const edgeG = Math.min(255, g + 35);
        const edgeB = Math.min(255, b + 25);
        ctx.strokeStyle = `rgba(${edgeR}, ${edgeG}, ${edgeB}, ${baseAlpha * (0.55 + spec * 0.45)})`;
      }
      ctx.lineWidth = Math.max(1.0, 1.3 * (proj[0].pScale || 1));
      ctx.stroke();
    }

    // Render Architectural Wireframe Ridges (Highlights)
    for (let e = 0; e < this.wireEdges.length; e++) {
      const [pA, pB, type] = this.wireEdges[e];
      const tA = transformPoint(pA);
      const tB = transformPoint(pB);

      ctx.beginPath();
      ctx.moveTo(tA.x, tA.y);
      ctx.lineTo(tB.x, tB.y);

      if (type === 'cyan-bright') {
        ctx.strokeStyle = `rgba(56, 225, 255, ${baseAlpha * 1.3})`;
        ctx.lineWidth = 2.0 * this.dpr;
      } else if (type === 'gold-arrow') {
        ctx.strokeStyle = `rgba(255, 225, 75, ${baseAlpha * 1.4})`;
        ctx.lineWidth = 2.2 * this.dpr;
      } else if (type === 'gold-amber') {
        ctx.strokeStyle = `rgba(255, 145, 45, ${baseAlpha * 0.9})`;
        ctx.lineWidth = 1.2 * this.dpr;
      } else if (type === 'gold-subtle') {
        ctx.strokeStyle = `rgba(220, 175, 70, ${baseAlpha * 0.8})`;
        ctx.lineWidth = 1.0 * this.dpr;
      } else {
        ctx.strokeStyle = `rgba(255, 220, 85, ${baseAlpha * 1.3})`;
        ctx.lineWidth = 2.0 * this.dpr;
      }
      ctx.stroke();
    }
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
