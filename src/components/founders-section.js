/**
 * PORTFOLIO 2.0 — FOUNDERS SECTION CONTROLLER
 * High-performance IntersectionObserver-driven scroll reveal
 * Ensures smooth staggered entrance and zero layout shifts
 */

export class FoundersSectionController {
  constructor() {
    this.section = document.getElementById('founders');
    if (!this.section) return;

    this.init();
  }

  init() {
    this.setupIntersectionReveal();
  }

  setupIntersectionReveal() {
    if (!('IntersectionObserver' in window)) {
      this.section.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.section.classList.add('is-visible');
          // Once revealed, disconnect to preserve GPU memory
          observer.unobserve(this.section);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    observer.observe(this.section);
  }
}
