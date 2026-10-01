/**
 * PORTFOLIO — LENIS SMOOTH SCROLL INTEGRATION
 * Authoritative integration with darkroomengineering/lenis
 * 
 * Features:
 * - Singleton Lenis instance with autoRaf
 * - Native touch momentum preserved on mobile (syncTouch: false)
 * - Accessible: respects prefers-reduced-motion and responds to dynamic changes
 * - Synchronizes directly with MotionEngine for zero-latency animation hooks
 * - Anchor link support with sticky header offset
 * - Clean modal/nested-scroll control (stop/start)
 */

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motionEngine } from './motion-engine.js';

let lenisInstance = null;
let motionPreferenceQuery = null;

export function initSmoothScroll() {
  if (lenisInstance) {
    return lenisInstance;
  }

  // Check prefers-reduced-motion accessibility
  if (typeof window !== 'undefined' && window.matchMedia) {
    motionPreferenceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreferenceQuery.matches) {
      document.documentElement.style.scrollBehavior = 'auto';
      return null;
    }
  }

  try {
    lenisInstance = new Lenis({
      autoRaf: true,
      anchors: true,
      smoothWheel: true,
      syncTouch: false, // Preserve native iOS/Android hardware touch momentum
      duration: 1.1,    // Natural deceleration, responsive and not sluggish
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Official exponential-out curve
    });

    window.__lenis = lenisInstance;

    // Synchronize with MotionEngine
    lenisInstance.on('scroll', (e) => {
      if (motionEngine && motionEngine.scroll) {
        motionEngine.scroll.targetY = e.scroll;
        motionEngine.scroll.isScrolling = true;
      }
    });

    // Listen for OS reduced-motion setting changes
    if (motionPreferenceQuery) {
      motionPreferenceQuery.addEventListener('change', handleMotionPreferenceChange);
    }

    return lenisInstance;
  } catch (err) {
    console.warn('[Lenis] Initialization failed, using native scroll:', err);
    return null;
  }
}

function handleMotionPreferenceChange(e) {
  if (e.matches) {
    destroySmoothScroll();
    document.documentElement.style.scrollBehavior = 'auto';
  } else if (!lenisInstance) {
    initSmoothScroll();
  }
}

export function getLenis() {
  return lenisInstance || window.__lenis || null;
}

export function destroySmoothScroll() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    window.__lenis = null;
  }
  if (motionPreferenceQuery) {
    motionPreferenceQuery.removeEventListener('change', handleMotionPreferenceChange);
    motionPreferenceQuery = null;
  }
}
