/**
 * PORTFOLIO 2.0 — CONTACT SECTION & FOOTER CONTROLLER
 * 
 * Features:
 * - Direct EmailJS Integration via @emailjs/browser SDK
 * - Environment Variable Configuration with Safe Fallbacks
 * - Strict Input Validation & Inline Visual Feedback
 * - Concurrency Lock: Prevents Duplicate Submissions
 * - Accessible Status Announcements (aria-live / role="status")
 * - Scroll-Triggered Reveal via IntersectionObserver
 * - Smooth Back-to-Top Navigation
 */

import emailjs from '@emailjs/browser';

export class ContactSectionController {
  constructor() {
    this.section = document.getElementById('contact');
    this.form = document.getElementById('contactForm');
    this.btn = document.getElementById('contactSubmitBtn');
    this.notice = document.getElementById('contactFormNotice');
    this.backToTopBtn = document.getElementById('footer-back-to-top');

    // EmailJS Configuration from Environment Variables with Safe Defaults
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_j8040mp';
    this.templateId = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || 'template_yryirjm';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'MravP7PCTKef8Vsid';
    this.directEmail = 'vardhanbillakanti125@gmail.com';

    this.isSubmitting = false;

    this.init();
  }

  init() {
    this.initEmailJS();
    this.setupScrollReveal();
    this.setupCardSpotlight();
    this.setupFormHandler();
    this.setupDirectEmail();
    this.setupBackToTop();
  }

  initEmailJS() {
    try {
      emailjs.init({ publicKey: this.publicKey });
    } catch (e) {
      console.warn('[ContactSection] emailjs.init warning:', e);
    }
  }

  setupScrollReveal() {
    if (!this.section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.section.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    observer.observe(this.section);
  }

  setupCardSpotlight() {
    const card = this.section?.querySelector('.contact-form-panel');
    if (!card) return;

    const isFinePointer = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
    if (!isFinePointer) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let cardRect = null;

    const updateRect = () => {
      cardRect = card.getBoundingClientRect();
    };

    const onMouseMove = (e) => {
      if (!cardRect) updateRect();
      targetX = e.clientX - cardRect.left;
      targetY = e.clientY - cardRect.top;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          card.style.setProperty('--card-mouse-x', `${targetX.toFixed(1)}px`);
          card.style.setProperty('--card-mouse-y', `${targetY.toFixed(1)}px`);
          card.style.setProperty('--card-spot-opacity', '1');
          rafId = null;
        });
      }
    };

    const onMouseEnter = () => {
      updateRect();
      card.style.setProperty('--card-spot-opacity', '1');
    };

    const onMouseLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      card.style.setProperty('--card-spot-opacity', '0');
    };

    card.addEventListener('mousemove', onMouseMove, { passive: true });
    card.addEventListener('mouseenter', onMouseEnter, { passive: true });
    card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });
  }

  setupFormHandler() {
    if (!this.form) return;

    // Clear invalid classes on user input
    const inputs = this.form.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) {
          input.classList.remove('invalid');
        }
        if (this.notice && this.notice.classList.contains('state-error')) {
          this.setNotice('', '');
        }
      });
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  isValidPhone(v) {
    if (!v.trim()) return true;
    return /^[\+]?[\d\s\-\(\)]{7,18}$/.test(v.trim());
  }

  setNotice(msg, state = '') {
    if (!this.notice) return;
    this.notice.textContent = msg;
    this.notice.className = 'contact-form-notice' + (state ? ` ${state}` : '');
  }

  setLoading(on) {
    if (!this.btn) return;
    if (on) {
      this.btn.classList.add('is-loading');
      this.btn.disabled = true;
    } else {
      this.btn.classList.remove('is-loading');
      this.btn.disabled = false;
    }
  }

  async handleSubmit() {
    // Prevent duplicate submissions while in flight
    if (this.isSubmitting) return;

    this.setNotice('', '');

    const nameEl = this.form.querySelector('#cf-name');
    const emailEl = this.form.querySelector('#cf-email');
    const phoneEl = this.form.querySelector('#cf-phone');
    const subjectEl = this.form.querySelector('#cf-subject');
    const messageEl = this.form.querySelector('#cf-message');

    [nameEl, emailEl, phoneEl, messageEl].forEach((el) => {
      if (el) el.classList.remove('invalid');
    });

    const rawName = (nameEl?.value || '').trim();
    const rawEmail = (emailEl?.value || '').trim();
    const rawPhone = (phoneEl?.value || '').trim();
    const rawSubject = (subjectEl?.value || '').trim();
    const rawMessage = (messageEl?.value || '').trim();

    let valid = true;
    if (!rawName) {
      if (nameEl) nameEl.classList.add('invalid');
      valid = false;
    }
    if (!rawEmail || !this.isValidEmail(rawEmail)) {
      if (emailEl) emailEl.classList.add('invalid');
      valid = false;
    }
    if (rawPhone && !this.isValidPhone(rawPhone)) {
      if (phoneEl) phoneEl.classList.add('invalid');
      valid = false;
    }
    if (!rawMessage) {
      if (messageEl) messageEl.classList.add('invalid');
      valid = false;
    }

    if (!valid) {
      this.setNotice('Please fill in all required fields with valid details.', 'state-error');
      return;
    }

    // Lock submission & activate loading state
    this.isSubmitting = true;
    this.setLoading(true);

    // Exact template variables required: name, email, phone, subject, message
    const templateParams = {
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      subject: rawSubject || 'Portfolio Message',
      message: rawMessage
    };

    try {
      // Single call to EmailJS Contact Us template.
      // Auto-reply template is linked and triggered automatically by EmailJS.
      await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        { publicKey: this.publicKey }
      );

      // On SUCCESS:
      // Clear/reset the form
      this.form.reset();
      [nameEl, emailEl, phoneEl, messageEl].forEach((el) => {
        if (el) el.classList.remove('invalid');
      });

      // Show verified success message
      this.setNotice(
        'Message sent successfully. Thanks for reaching out — I’ve received your message and will get back to you within 1 business day.',
        'state-success'
      );
    } catch (err) {
      // On FAILURE:
      // Keep entered data intact (do NOT reset form)
      this.setNotice(
        'Unable to send message right now. Please try again or email me directly at ' + this.directEmail,
        'state-error'
      );
      console.error('[ContactSection] EmailJS send error:', err?.status || err?.name || 'Error', err?.text || err?.message || err);
    } finally {
      // Restore submit button
      this.setLoading(false);
      this.isSubmitting = false;
    }
  }

  setupDirectEmail() {
    const directEmail = document.getElementById('contactDirectEmail') || document.querySelector('.contact-direct-card');
    if (!directEmail) return;

    const mailtoUrl = `mailto:${this.directEmail}?subject=Portfolio%20Inquiry`;

    directEmail.addEventListener('click', () => {
      window.location.href = mailtoUrl;
    });

    directEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = mailtoUrl;
      }
    });
  }

  setupBackToTop() {
    if (!this.backToTopBtn) return;

    this.backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}
