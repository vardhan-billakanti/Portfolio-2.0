/**
 * PORTFOLIO 2.0 — ACADEMICS SECTION CONTROLLER
 * 
 * Orchestrates:
 * 1. Synchronized dual heading-line convergence (RIGHT → CENTER ← LEFT) on scroll down
 * 2. Synchronized dual heading-line retracing (RIGHT ← CENTER → LEFT) on scroll up
 * 3. Section entrance reveal for cards and header
 * 4. Leaves cards connector rail timeline static and untouched
 * 
 * Performance:
 * - Zero CPU overhead: Scroll listener attached only while section is in/near viewport.
 * - Hardware-accelerated GPU scaleX transforms driven by scroll position.
 * - Throttled with requestAnimationFrame.
 */

import { motionEngine } from '../core/motion-engine.js';

export class AcademicsExperienceController {
  constructor() {
    this.section = document.getElementById('academics');
    if (!this.section) return;

    this.headingHeader = this.section.querySelector('.academics-header');
    this.isReducedMotion = motionEngine.prefersReducedMotion;
    this.unsubscribers = [];

    this.isIntersecting = false;
    this.hasScrollListener = false;
    this.ticking = false;
    this.lastProgress = -1;

    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      this.section.classList.add('is-visible');
      if (this.headingHeader) {
        this.headingHeader.style.setProperty('--acad-text-progress', '1');
      }
      return;
    }

    this.initObserver();
  }

  /**
   * IntersectionObserver attaches scroll listener only when Academics is approaching/inside viewport
   */
  initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isIntersecting = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Reveal cards/header on first entry
          this.section.classList.add('is-visible');
          this.attachScrollListener();
          this.updateProgress();
        } else {
          // When scrolled above Academics (section is below viewport)
          if (entry.boundingClientRect.top > 0) {
            this.setProgress(0);
          }
          this.detachScrollListener();
        }
      });
    }, {
      threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0],
      rootMargin: '300px 0px 300px 0px'
    });

    observer.observe(this.section);

    // Initial check in case page loaded already scrolled to Academics
    this.updateProgress();
  }

  measure() {
    if (!this.headingHeader) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rect = this.headingHeader.getBoundingClientRect();
    this.headingTop = rect.top + scrollY;
    this.windowHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  }

  attachScrollListener() {
    if (this.hasScrollListener) return;
    this.hasScrollListener = true;
    this.measure();

    this.unsubscribers.push(
      motionEngine.subscribeScroll(() => {
        if (this.isIntersecting) {
          this.updateProgress();
        }
      })
    );

    this.unsubscribers.push(
      motionEngine.subscribeResize(() => {
        this.measure();
        this.updateProgress();
      })
    );
  }

  detachScrollListener() {
    if (!this.hasScrollListener) return;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.hasScrollListener = false;
  }

  /**
   * Computes synchronized heading text lines scroll progress [0..1]
   * - 0: Line 1 offset to RIGHT (+190px..+240px), Line 2 offset to LEFT (-190px..-240px)
   * - 1: Both lines converge to exact CENTER (progress 100%)
   * - Clamped at 1 while user continues down into Academic cards
   * - Smoothly retraces in reverse (1 -> 0) when scrolling back up
   * 
   * Zero getBoundingClientRect layout queries during scroll.
   */
  updateProgress() {
    if (!this.headingHeader) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const currentTop = this.headingTop - scrollY;

    // Start converging as the heading enters the viewport (92% from top)
    const startY = this.windowHeight * 0.92;
    // Reach full convergence at center when heading reaches comfortable upper-center reading view (42% from top)
    const endY = this.windowHeight * 0.42;

    let progress = (startY - currentTop) / (startY - endY);
    progress = Math.max(0, Math.min(1, progress));

    this.setProgress(progress);
  }

  setProgress(progress) {
    if (Math.abs(this.lastProgress - progress) < 0.0005) return;
    this.lastProgress = progress;

    if (this.headingHeader) {
      this.headingHeader.style.setProperty('--acad-text-progress', progress.toFixed(4));
    }
  }

  destroy() {
    this.detachScrollListener();
  }
}
