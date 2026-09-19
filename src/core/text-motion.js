/**
 * PORTFOLIO 2.0 — ACCESSIBLE TYPOGRAPHY MOTION SYSTEM
 * 
 * Reusable, high-performance text animation engine:
 * - Section heading scroll reveal: Smooth transform + opacity + blur-to-sharp settling
 *   WITHOUT modifying inner HTML or interfering with text gradients and spans.
 * - Selective interactive text hover effects (underline morph, subtle shift).
 * - 100% accessible: respects prefers-reduced-motion with instantaneous static resolution.
 */

import { motionEngine } from './motion-engine.js';

export class TextMotionSystem {
  constructor() {
    this.isReduced = motionEngine.prefersReducedMotion;
    this.observer = null;
    this.init();
  }

  init() {
    if (this.isReduced) {
      this.resolveAllStatic();
      return;
    }

    this.setupHeadingReveals();
    this.setupHoverInteractions();
  }

  /**
   * Sets up IntersectionObserver for section headings WITHOUT modifying innerHTML or text colors.
   * Only animates transform, opacity, and blur on the container.
   */
  setupHeadingReveals() {
    const headingSelectors = [
      '.toolkit-main-heading',
      '.projects-main-heading',
      '.cert-main-heading',
      '.lorven-headline'
    ];

    const headings = document.querySelectorAll(headingSelectors.join(', '));
    if (!headings.length) return;

    headings.forEach((heading) => {
      heading.classList.add('section-heading-reveal');
    });

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('heading-in-view');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      headings.forEach(h => this.observer.observe(h));
    } else {
      headings.forEach(h => h.classList.add('heading-in-view'));
    }
  }

  /**
   * Enhances navigation and key labels with selective, subtle text interactions.
   */
  setupHoverInteractions() {
    if (motionEngine.isTouch) return;

    // Navigation links subtle underline morph
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-drawer a');
    navLinks.forEach(link => {
      link.classList.add('hover-underline-morph');
    });

    // Project card titles subtle displacement
    const projectTitles = document.querySelectorAll('.project-card-title, .founder-name');
    projectTitles.forEach(title => {
      title.classList.add('hover-text-shift');
    });
  }

  /**
   * Instant static resolution when reduced motion is preferred.
   */
  resolveAllStatic() {
    const headings = document.querySelectorAll(
      '.toolkit-main-heading, .projects-main-heading, .cert-main-heading, .lorven-headline'
    );
    headings.forEach(h => h.classList.add('heading-in-view'));
  }
}

export const textMotionSystem = new TextMotionSystem();
