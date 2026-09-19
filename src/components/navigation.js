/**
 * Navigation Component Controller — Portfolio 2.0
 * High-Performance Navbar Architecture:
 * - Cancellable, cubic/quartic ease-out rAF programmatic smooth scroll
 * - Instant cancellation on competing clicks or manual user input (wheel/touch)
 * - Zero layout reflows (document section offsets pre-cached, zero getBoundingClientRect in scroll loop)
 * - Backdrop blur density tracking
 * - Mobile drawer toggle & auto-close
 */

export class NavigationController {
  constructor(navElement, mobileToggle, mobileDrawer) {
    this.nav = navElement;
    this.toggle = mobileToggle;
    this.drawer = mobileDrawer;
    this.isOpen = false;
    this.activeSectionId = 'home';

    // Programmatic smooth scroll state
    this.isProgrammaticScroll = false;
    this.scrollRaf = null;

    // Cached section measurements (zero getBoundingClientRect during scroll)
    this.sectionIds = [
      'home',
      'about',
      'academics',
      'toolkit',
      'projects',
      'certifications',
      'lorven',
      'founders',
      'contact'
    ];
    this.registeredSections = [];
    this.cachedSections = [];

    window.__portfolioNav = this;

    this.init();
  }

  init() {
    this.collectSections();
    this.measureSections();
    this.setupBackdropScroll();
    this.setupMobileDrawer();
    this.setupActiveSectionTracking();
    this.setupSmoothScroll();
    this.setupManualScrollInterrupt();
    this.setupHashNavigation();

    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this.measureSections();
        this.evaluateActiveSection();
      }, 100);
    }, { passive: true });

    window.addEventListener('load', () => {
      this.measureSections();
      this.evaluateActiveSection();
    }, { once: true });
  }

  collectSections() {
    this.registeredSections = [];
    this.sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.registeredSections.push({ id, element });
      }
    });
  }

  measureSections() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    this.cachedSections = this.registeredSections.map(({ id, element }) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top + scrollY;
      const height = element.offsetHeight || rect.height;
      return {
        id,
        top,
        height,
        bottom: top + height
      };
    });
  }

  setupBackdropScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          if (scrollY > 40) {
            this.nav.classList.add('scrolled');
          } else {
            this.nav.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  setupMobileDrawer() {
    if (!this.toggle || !this.drawer) return;

    this.toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.toggle.classList.toggle('open', this.isOpen);
      this.drawer.classList.toggle('open', this.isOpen);
      document.body.style.overflow = this.isOpen ? 'hidden' : '';
    });

    const drawerLinks = this.drawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.isOpen = false;
        this.toggle.classList.remove('open');
        this.drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /**
   * Sets the active state on both desktop and mobile navigation links
   * @param {string} sectionId - The ID of the currently active section (without #)
   */
  setActiveSection(sectionId) {
    if (!sectionId || this.activeSectionId === sectionId) return;
    this.activeSectionId = sectionId;

    const allNavLinks = document.querySelectorAll(
      '.site-nav .nav-link-item a, .mobile-nav-drawer .nav-link-item a'
    );

    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const cleanHref = href.replace(/^#/, '');
      if (cleanHref === sectionId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    const contactCapsule = document.querySelector('.nav-contact-capsule');
    if (contactCapsule) {
      if (sectionId === 'contact') {
        contactCapsule.classList.add('active');
      } else {
        contactCapsule.classList.remove('active');
      }
    }
  }

  /**
   * Evaluates active section based entirely on pre-cached geometry.
   * Zero DOM reads, zero forced reflows during scrolling.
   */
  evaluateActiveSection() {
    if (this.isProgrammaticScroll) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;

    // At top of page: always activate HOME
    if (scrollY < 90) {
      this.setActiveSection('home');
      return;
    }

    // Bottom of page check
    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    if ((window.innerHeight + scrollY) >= (docHeight - 60)) {
      if (this.cachedSections.length > 0) {
        this.setActiveSection(this.cachedSections[this.cachedSections.length - 1].id);
        return;
      }
    }

    const navHeight = 76;
    const activeThresholdY = scrollY + navHeight + 110;

    let activeMatch = null;
    for (let i = this.cachedSections.length - 1; i >= 0; i--) {
      const sec = this.cachedSections[i];
      if (activeThresholdY >= sec.top && scrollY < sec.bottom) {
        activeMatch = sec.id;
        break;
      }
    }

    if (activeMatch) {
      this.setActiveSection(activeMatch);
    } else if (scrollY < 250) {
      this.setActiveSection('home');
    }
  }

  setupActiveSectionTracking() {
    this.setActiveSection('home');

    // Throttled scroll listener using cached measurements
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking && !this.isProgrammaticScroll) {
        window.requestAnimationFrame(() => {
          this.evaluateActiveSection();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    this.evaluateActiveSection();
  }

  /**
   * Cancels programmatic scroll immediately if user interacts with wheel, touch, or keys
   */
  setupManualScrollInterrupt() {
    const interrupt = () => {
      if (this.isProgrammaticScroll) {
        this.cancelProgrammaticScroll();
      }
    };

    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space', 'Home', 'End'].includes(e.code)) {
        interrupt();
      }
    }, { passive: true });
  }

  cancelProgrammaticScroll() {
    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
    this.isProgrammaticScroll = false;
    window.__isProgrammaticNavScroll = false;
    window.__programmaticNavTarget = null;
    this.evaluateActiveSection();
  }

  /**
   * High-performance programmatic smooth scroll using requestAnimationFrame
   * Features:
   * - Natural quartic ease-out deceleration
   * - Proportional distance-based duration (500ms to ~850ms)
   * - Clean cancellation if user clicks another nav link or scrolls manually
   * - Zero conflicting animation loops
   */
  scrollToTarget(targetY, targetId) {
    // 1. Cleanly cancel any previous scroll animation
    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }

    const startY = window.scrollY || window.pageYOffset || 0;
    const distance = targetY - startY;

    // Immediately activate the clicked navbar link
    this.setActiveSection(targetId);

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      this.isProgrammaticScroll = false;
      window.__isProgrammaticNavScroll = false;
      window.__programmaticNavTarget = null;
      return;
    }

    // 2. Set programmatic lock flags
    this.isProgrammaticScroll = true;
    window.__isProgrammaticNavScroll = true;
    window.__programmaticNavTarget = targetId;

    // Natural distance-scaled duration: ~500ms for short leaps, ~850ms for 4,500px travels
    const duration = Math.min(880, Math.max(480, Math.sqrt(Math.abs(distance)) * 13.0));
    const startTime = performance.now();

    // Quartic ease-out curve: swift launch, buttery soft landing
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutQuart(progress);

      const currentY = startY + distance * easedProgress;
      window.scrollTo(0, currentY);

      if (progress < 1) {
        this.scrollRaf = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        this.scrollRaf = null;
        this.isProgrammaticScroll = false;
        window.__isProgrammaticNavScroll = false;
        window.__programmaticNavTarget = null;
        this.setActiveSection(targetId);
      }
    };

    this.scrollRaf = requestAnimationFrame(step);
  }

  setupSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = href.replace(/^#/, '');
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      e.preventDefault();

      // Recalculate target position
      const navHeight = 72;
      const elementPosition = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      const offsetPosition = Math.max(0, elementPosition - navHeight);

      this.scrollToTarget(offsetPosition, targetId);

      if (history.pushState) {
        history.pushState(null, null, href);
      }
    });
  }

  /**
   * Programmatically scrolls to any section taking the fixed navbar into account
   * @param {string} targetId - Section ID without #
   * @returns {boolean}
   */
  scrollToSection(targetId) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return false;
    const navHeight = 72;
    const elementPosition = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
    const offsetPosition = targetId === 'home' ? 0 : Math.max(0, elementPosition - navHeight);

    this.scrollToTarget(offsetPosition, targetId);

    if (history.pushState) {
      history.pushState(null, null, `#${targetId}`);
    }
    return true;
  }

  /**
   * Handles hash navigation smoothly with navbar offset when page loads or hash changes
   */
  setupHashNavigation() {
    const handleHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.startsWith('#projects/')) return;
      const targetId = hash.replace(/^#/, '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        setTimeout(() => {
          this.scrollToSection(targetId);
        }, 120);
      }
    };

    window.addEventListener('hashchange', handleHash);
    if (window.location.hash && !window.location.hash.startsWith('#projects/')) {
      window.addEventListener('load', handleHash, { once: true });
    }
  }
}

/**
 * Global navigation helper to scroll to any section smoothly with 72px navbar offset
 * @param {string} targetId - Section ID without #
 * @returns {boolean}
 */
export function navigateToSection(targetId) {
  if (window.__portfolioNav && typeof window.__portfolioNav.scrollToSection === 'function') {
    return window.__portfolioNav.scrollToSection(targetId);
  }
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return false;
  const navHeight = 72;
  const elementPosition = targetElement.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
  const offsetPosition = targetId === 'home' ? 0 : Math.max(0, elementPosition - navHeight);
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  if (history.pushState) {
    history.pushState(null, null, `#${targetId}`);
  }
  return true;
}

