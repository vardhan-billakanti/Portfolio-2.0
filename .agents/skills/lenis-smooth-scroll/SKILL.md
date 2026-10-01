---
name: lenis-smooth-scroll
description: Comprehensive guide and production patterns for integrating the official Lenis smooth-scroll library (@darkroomengineering/lenis) into modern web applications and static sites. Covers auditing existing scroll/animation architecture, correct installation, autoRaf vs custom rAF, GSAP ScrollTrigger synchronization, anchors, nested scroll/modals, touch handling, and prefers-reduced-motion accessibility.
---

# Lenis Smooth Scroll Guide & Reference

Authoritative engineering reference for integrating and configuring the official **Lenis** smooth scroll library ([darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)) with maximum performance, fluid responsiveness, zero layout conflicts, and complete accessibility.

---

## 1. Pre-Installation Audit Workflow

Before installing or configuring Lenis in any project, execute this diagnostic audit:

1. **Check `package.json`**:
   - Verify if `lenis` or an obsolete package (`@studio-freight/lenis`, `locomotive-scroll`, `smooth-scrollbar`) is already installed.
   - If an older package exists, plan migration to the official `lenis` package.
2. **Scan for Existing Smooth Scroll Implementations**:
   - Search CSS for `html { scroll-behavior: smooth; }`. **Crucial**: Native CSS `scroll-behavior: smooth` conflicts with Lenis's physics engine and can cause stutter/jitter. Remove or set to `auto` when Lenis is active.
   - Search JS for existing `window.addEventListener('scroll')` handlers, `requestAnimationFrame` loops, or scroll hijacking scripts.
3. **Inspect Animation Engines & GSAP**:
   - Check if GSAP, ScrollTrigger, Framer Motion, or custom WebGL/three.js scroll-driven loops exist.
   - If GSAP ScrollTrigger is present, Lenis MUST synchronize with GSAP's ticker rather than running an independent competing RAF loop.
4. **Identify Nested Scroll Containers & Modals**:
   - Locate modals, dialogs, slide-out drawers, code blocks, or chat widgets that have `overflow-y: auto` or `overflow-y: scroll`.
   - Add `data-lenis-prevent` to nested scroll containers so scrolling inside them does not bubble or fight the main page scroll.

---

## 2. Installation & Setup

### Official Package
Install the official npm package:
```bash
npm install lenis
```

### Official CSS
Lenis requires minimal CSS to normalize document height and support stopping/nested scroll:
```javascript
import 'lenis/dist/lenis.css';
```
Or include the official CSS rules directly:
```css
html.lenis,
html.lenis body {
  height: auto;
}

.lenis:not(.lenis-autoToggle).lenis-stopped {
  overflow: clip;
}

.lenis [data-lenis-prevent],
.lenis [data-lenis-prevent-wheel],
.lenis [data-lenis-prevent-touch] {
  overscroll-behavior: contain;
}
```

---

## 3. Core Initialization Patterns

### Pattern A: Standard Standalone Initialization (autoRaf)
Best for static sites or SPAs without a centralized ticker or GSAP ScrollTrigger:

```javascript
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Respect prefers-reduced-motion accessibility
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

if (!prefersReducedMotion) {
  lenis = new Lenis({
    autoRaf: true,         // Automatically runs rAF loop
    anchors: true,         // Enables smooth scroll to internal anchor links (#id)
    smoothWheel: true,     // Smooth wheel scrolling on desktop
    syncTouch: false,      // Preserve native mobile touch momentum (do NOT force synthetic smooth touch unless specifically required)
    duration: 1.1,         // Natural, responsive deceleration
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential out
  });
}
```

### Pattern B: GSAP & ScrollTrigger Synchronization
When GSAP ScrollTrigger is present, disable `autoRaf` and bind to GSAP's ticker:

```javascript
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  autoRaf: false,  // Let GSAP drive the loop to prevent two competing RAF loops
  anchors: true,
  smoothWheel: true,
  syncTouch: false,
});

// Synchronize ScrollTrigger on Lenis scroll
lenis.on('scroll', ScrollTrigger.update);

// Drive Lenis from GSAP's ticker
gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert seconds to milliseconds
});

// Disable lag smoothing in GSAP to prevent visual jumps on frame drops
gsap.ticker.lagSmoothing(0);
```

### Pattern C: Centralized RAF Loop Integration
If the application already maintains a global animation loop:

```javascript
const lenis = new Lenis({ autoRaf: false, anchors: true });

function masterAnimationLoop(time) {
  lenis.raf(time);
  // other render calls (particles, custom cursor, canvas)
  requestAnimationFrame(masterAnimationLoop);
}
requestAnimationFrame(masterAnimationLoop);
```

---

## 4. Anchor Links & Internal Navigation

Lenis provides built-in anchor link handling when `anchors: true` is configured:
- Lenis intercepts clicks on `<a href="#section">` and calls `lenis.scrollTo('#section')`.
- For fixed/sticky headers, pass an offset:
```javascript
const lenis = new Lenis({
  autoRaf: true,
  anchors: {
    offset: -80, // Offset for sticky navbar height
    duration: 1.2,
  },
});
```
Or trigger programmatically:
```javascript
lenis.scrollTo('#contact', { offset: -80, duration: 1.2 });
```

---

## 5. Nested Scroll Containers & Modals

When a user scrolls inside an open modal, popup, chat drawer, or preformatted code container, Lenis must not hijack the scroll event:
- Add the `data-lenis-prevent` attribute to the scrollable container:
```html
<div class="modal-body" data-lenis-prevent>
  <!-- Scrollable modal content -->
</div>
```
- When opening full-screen non-scrollable overlays, temporarily stop Lenis:
```javascript
function openModal() {
  lenis.stop();
  modal.classList.add('is-open');
}

function closeModal() {
  lenis.start();
  modal.classList.remove('is-open');
}
```

---

## 6. Mobile & Touch Considerations

- **Default rule**: Keep `syncTouch: false` (the default). Native mobile touch scrolling (iOS Safari and Android Chrome) has built-in hardware momentum and gesture ergonomics. Simulating desktop smooth wheel on mobile touch often causes latency, rubber-banding glitches, or sluggish response.
- Allow Lenis to enhance desktop mousewheel/trackpad scrolling while preserving native touch velocity on mobile devices.

---

## 7. Accessibility (prefers-reduced-motion)

Always check and listen for user motion preferences:
```javascript
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function applyMotionPreference(e) {
  if (e.matches) {
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
    document.documentElement.style.scrollBehavior = 'auto';
  } else if (!lenis) {
    lenis = new Lenis({ autoRaf: true, anchors: true });
  }
}

motionQuery.addEventListener('change', applyMotionPreference);
```

---

## 8. Anti-Patterns & Pitfalls to Avoid

| Pitfall | Problem | Solution |
| :--- | :--- | :--- |
| `html { scroll-behavior: smooth; }` | Competes with Lenis JS physics, creating stutter or rubberbanding | Remove or set to `auto` |
| `autoRaf: true` with GSAP ticker | Two separate RAF callbacks updating scroll out-of-phase | Set `autoRaf: false` and use `gsap.ticker.add` |
| Multiple Lenis instances | Instantiating Lenis on window more than once | Store single singleton instance on `window.__lenis` or export from module |
| Forcing `syncTouch: true` globally | Degrades native mobile momentum scrolling | Leave `syncTouch: false` unless custom touch drag physics required |
| Uncontained modal scroll | Page scrolls behind the modal when scrolling reaches edge | Add `data-lenis-prevent` to modal scroll container |
| Missing `lenis.destroy()` on unmount | Memory leaks and orphan RAF listeners in SPAs | Call `lenis.destroy()` in component unmount / cleanup hooks |
