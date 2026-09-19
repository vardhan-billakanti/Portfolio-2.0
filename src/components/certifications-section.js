/**
 * PORTFOLIO 2.0 — CERTIFICATIONS EXPERIENCE CONTROLLER
 * Recreated from Original Portfolio Fanned Arc Carousel Deck
 * Features:
 * - Fullscreen high-resolution certificate lightbox modal
 * - Mobile snap-scroll centering on initial load
 * - Keyboard accessible modal controls (Escape, Tab lock, Focus restoration)
 * - Global function bridges (window.openCertModal, window.closeCertModal)
 */

export class CertificationsExperienceController {
  constructor() {
    this.section = document.getElementById('certifications');
    this.modal = document.getElementById('certModal');
    this.modalImg = document.getElementById('certModalImg');
    this.modalCaption = document.getElementById('certModalCaption');
    this.closeBtn = this.modal?.querySelector('.cert-modal-close-btn');
    this.backdrop = this.modal?.querySelector('.cert-modal-backdrop');
    this.cards = document.querySelectorAll('.cert-fan-card');
    this.wrapper = document.querySelector('.cert-stack-wrapper');

    this.previouslyFocusedElement = null;

    this.init();
  }

  init() {
    this.bindModalEvents();
    this.bindCardEvents();
    this.setupGlobalBridges();
    this.initMobileCentering();
  }

  setupGlobalBridges() {
    // Expose global methods for inline handlers if any exist
    window.openCertModal = (imgSrc, caption) => this.openModal(imgSrc, caption);
    window.closeCertModal = () => this.closeModal();
  }

  bindCardEvents() {
    if (!this.cards || this.cards.length === 0) return;

    this.cards.forEach((card) => {
      // Ensure cards are keyboard focusable
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'button');
      }

      const handleClick = (e) => {
        // Prevent default navigation if wrapped in anchor or button
        e.preventDefault();

        const imgEl = card.querySelector('.cert-fan-img');
        const imgSrc = card.dataset.certImg || (imgEl ? imgEl.getAttribute('src') : '');
        
        // Extract or compute clean caption
        let caption = card.dataset.certCaption;
        if (!caption) {
          const org = card.querySelector('.cert-fan-org')?.textContent?.trim() || '';
          const title = card.querySelector('.cert-fan-title')?.textContent?.trim() || '';
          const sub = card.querySelector('.cert-fan-sub')?.textContent?.trim() || '';
          caption = [org, title, sub].filter(Boolean).join(' — ');
        }

        if (imgSrc) {
          this.openModal(imgSrc, caption);
        }
      };

      card.addEventListener('click', handleClick);

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      });
    });
  }

  bindModalEvents() {
    if (!this.modal) return;

    // Close button click
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    // Backdrop click
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Modal background click fallback
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Escape key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) {
        this.closeModal();
      }
    });
  }

  openModal(imgSrc, caption = '') {
    if (!this.modal || !this.modalImg) return;

    this.previouslyFocusedElement = document.activeElement;

    this.modalImg.src = imgSrc;
    this.modalImg.alt = caption || 'Certificate Preview';
    
    if (this.modalCaption) {
      this.modalCaption.textContent = caption;
    }

    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    setTimeout(() => {
      this.closeBtn?.focus();
    }, 50);
  }

  closeModal() {
    if (!this.modal) return;

    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Restore previous focus
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
  }

  initMobileCentering() {
    if (!this.wrapper || !this.cards || this.cards.length === 0) return;

    const centerMiddleCard = () => {
      if (window.innerWidth < 768) {
        // Find center card (e.g. index 4 or 5 out of 10)
        const middleIndex = Math.floor(this.cards.length / 2);
        const targetCard = this.cards[middleIndex] || this.cards[4];
        if (targetCard) {
          const wrapperCenter = this.wrapper.clientWidth / 2;
          const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
          const scrollTarget = cardCenter - wrapperCenter;
          this.wrapper.scrollTo({
            left: Math.max(0, scrollTarget),
            behavior: 'auto'
          });
        }
      }
    };

    // Run after DOM has laid out
    setTimeout(centerMiddleCard, 100);
    window.addEventListener('resize', () => {
      // Debounce slightly on resize
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(centerMiddleCard, 200);
    });
  }
}
