/**
 * Scroll Guide Component
 * Controls smooth transition between hero and Section 01.
 */

export class ScrollGuide {
  constructor(scrollCueElement, targetSectionSelector = '#architecture') {
    this.scrollCue = scrollCueElement;
    this.targetSection = document.querySelector(targetSectionSelector);
    this.init();
  }

  init() {
    if (this.scrollCue && this.targetSection) {
      this.scrollCue.addEventListener('click', (e) => {
        e.preventDefault();
        this.targetSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
}
