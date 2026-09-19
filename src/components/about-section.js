/**
 * PORTFOLIO 2.0 — ABOUT ME SECTION CONTROLLER
 * Premium motion system:
 *  - Cinematic one-shot scroll reveal with IntersectionObserver
 *  - Interest pill stagger via CSS custom properties
 *  - Micro-scroll parallax (image + background grid) — rAF, passive
 *  - Touch-safe hover interactions
 */

export class AboutExperienceController {
  constructor() {
    this.section = document.getElementById('about');
    if (!this.section) return;

    this.photoWrapper  = this.section.querySelector('.about-photo-wrapper');
    this.ambientDepth  = this.section.querySelector('.about-ambient-depth');
    this.pills         = [...this.section.querySelectorAll('.about-interest-tag')];

    // Reduced-motion preference — checked once, respected everywhere
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.stampPillStaggerIndices();
    this.setupScrollReveal();

    if (!this.prefersReduced) {
      this.setupScrollParallax();
    }
  }

  /* -----------------------------------------------------------------------
     PILL STAGGER — inject --pill-i CSS custom property so CSS transition-delay
     drives the sequential appearance without any JS animation loop
  ----------------------------------------------------------------------- */
  stampPillStaggerIndices() {
    this.pills.forEach((pill, i) => {
      pill.style.setProperty('--pill-i', i);
    });
  }

  /* -----------------------------------------------------------------------
     SCROLL REVEAL — one-shot IntersectionObserver
     Adds 'is-visible' to the section which triggers all CSS transitions
  ----------------------------------------------------------------------- */
  setupScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      this.section.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.section.classList.add('is-visible');
            obs.unobserve(entry.target); // Fire once only — no re-trigger
          }
        });
      },
      {
        root: null,
        threshold: 0.02,
        rootMargin: '100px 0px 100px 0px'
      }
    );

    observer.observe(this.section);
  }

  measure() {
    if (!this.section) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rect = this.section.getBoundingClientRect();
    this.sectionTop = rect.top + scrollY;
    this.sectionHeight = this.section.offsetHeight || rect.height;
    this.winH = window.innerHeight || 800;
  }

  /* -----------------------------------------------------------------------
     SCROLL PARALLAX — extremely subtle 2–4px vertical drift on image + grid
     Uses passive scroll listener + rAF with pre-cached section coordinates.
     Stops when section is not in viewport to protect performance.
  ----------------------------------------------------------------------- */
  setupScrollParallax() {
    const photoColumn = this.section.querySelector('.about-photo-column');
    if (!photoColumn) return;

    let ticking = false;
    let isInViewport = false;

    this.measure();
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.measure(), 100);
    }, { passive: true });

    const visibilityObserver = new IntersectionObserver(
      entries => {
        isInViewport = entries[0].isIntersecting;
        if (isInViewport) {
          this.measure();
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(this.section);

    const onScroll = () => {
      if (!isInViewport || ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (!isInViewport) {
          ticking = false;
          return;
        }

        const scrollY = window.scrollY || window.pageYOffset || 0;
        const currentTop = this.sectionTop - scrollY;
        const progress = 1 - ((currentTop + this.sectionHeight) / (this.winH + this.sectionHeight));
        const clamped  = Math.max(0, Math.min(1, progress));

        // Photo column: ±3px vertical drift (hardware accelerated translate3d)
        const imgShift = (clamped - 0.5) * 6;
        photoColumn.style.transform = `translate3d(0, ${imgShift.toFixed(2)}px, 0)`;

        // Background grid: ±2px opposite direction for subtle depth
        if (this.ambientDepth) {
          const bgShift = (clamped - 0.5) * -4;
          this.ambientDepth.style.transform = `translate3d(0, ${bgShift.toFixed(2)}px, 0)`;
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
