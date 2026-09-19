/**
 * PORTFOLIO 2.0 — HERO CINEMATIC SEQUENCE ORCHESTRATOR
 * 
 * Drives the clean 8-state cinematic opening sequence:
 * State 1 (0ms): Pure black void
 * State 2 (200ms): Central focal ignition
 * State 3 (500ms): Soft radial line emergence
 * State 4 (1000ms): High-speed outward acceleration burst
 * State 5 (1500ms): Full radial expansion
 * State 6 (2000ms): First name typography reveals (BILLAKANTI)
 * State 7 (2300ms): Last name typography locks into center (JAYA VARDHAN)
 * State 8 (2700ms): Settles into smooth ambient cruise with signature, subline, and interactive CTAs
 * 
 * Features:
 * - High-speed spacebar skip to settled state.
 * - Respects prefers-reduced-motion: immediately skips to settled.
 */

import { motionEngine } from '../core/motion-engine.js';

export class HeroSequenceOrchestrator {
  constructor(canvasEngine, elements) {
    this.canvas = canvasEngine;
    this.elements = elements;
    this.currentState = 1;
    this.isCompleted = false;
    this.timers = [];
  }

  start() {
    if (motionEngine.prefersReducedMotion) {
      this.skipToSettled();
      return;
    }

    // STATE 1 (0ms): Void black screen
    this.transitionToState1();

    // STATE 2 (200ms): Central ignition point
    this.addTimer(() => this.transitionToState2(), 200);

    // STATE 3 (500ms): Radial streaks softly emerge
    this.addTimer(() => this.transitionToState3(), 500);

    // STATE 4 (1000ms): Outward acceleration surge
    this.addTimer(() => this.transitionToState4(), 1000);

    // STATE 5 (1500ms): Full radial expansion
    this.addTimer(() => this.transitionToState5(), 1500);

    // STATE 6 (2000ms): First Name reveal
    this.addTimer(() => this.transitionToState6(), 2000);

    // STATE 7 (2300ms): Last Name reveals
    this.addTimer(() => this.transitionToState7(), 2300);

    // STATE 8 (2700ms): Settles into ambient cruise & reveals UI
    this.addTimer(() => this.transitionToState8(), 2700);
  }

  addTimer(fn, delay) {
    const id = setTimeout(fn, delay);
    this.timers.push(id);
    return id;
  }

  clearAllTimers() {
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
  }

  transitionToState1() {
    this.currentState = 1;
    if (this.canvas) {
      this.canvas.setGlobalAlpha(0);
      this.canvas.setSpeed(1.0, true);
    }
  }

  transitionToState2() {
    this.currentState = 2;
    if (this.elements.singularity) {
      this.elements.singularity.classList.add('active');
    }
  }

  transitionToState3() {
    this.currentState = 3;
    if (this.canvas) {
      this.canvas.setGlobalAlpha(0.45);
      this.canvas.setSpeed(2.2);
    }
  }

  transitionToState4() {
    this.currentState = 4;
    if (this.canvas) {
      this.canvas.setGlobalAlpha(0.90);
      this.canvas.setSpeed(6.5);
    }
    if (this.elements.singularity) {
      this.elements.singularity.classList.remove('active');
      this.elements.singularity.classList.add('faded');
    }
  }

  transitionToState5() {
    this.currentState = 5;
    if (this.canvas) {
      this.canvas.setGlobalAlpha(1.0);
      this.canvas.setSpeed(8.0);
    }
  }

  transitionToState6() {
    this.currentState = 6;
    if (this.canvas) {
      this.canvas.setSpeed(3.8);
    }
    if (this.elements.firstName) {
      this.elements.firstName.classList.add('revealed');
    }
  }

  transitionToState7() {
    this.currentState = 7;
    if (this.canvas) {
      this.canvas.setSpeed(2.6);
    }
    if (this.elements.lastName) {
      this.elements.lastName.classList.add('revealed');
    }
  }

  transitionToState8() {
    this.currentState = 8;
    this.isCompleted = true;

    if (this.canvas) {
      this.canvas.setSpeed(2.2);
    }

    if (this.elements.nav) {
      this.elements.nav.classList.remove('nav-hidden');
      this.elements.nav.classList.add('nav-visible');
    }

    if (this.elements.contentWrapper) {
      this.elements.contentWrapper.classList.add('settled');
    }

    const signature = document.getElementById('hero-signature');
    if (signature) {
      signature.style.opacity = '1';
      signature.style.transform = 'translateY(0)';
    }

    const subline = document.querySelector('.hero-subline');
    if (subline) {
      subline.style.opacity = '1';
      subline.style.transform = 'translateY(0)';
    }

    const social = document.querySelector('.hero-social-constellation');
    if (social) {
      social.style.opacity = '1';
      social.style.transform = 'translateY(0)';
    }

    const launcher = this.elements.bobLauncher || this.elements.nodeLauncher;
    if (launcher) {
      launcher.classList.remove('launcher-hidden');
      launcher.classList.add('launcher-visible');
    }
  }

  skipToSettled() {
    if (this.isCompleted) return;
    this.clearAllTimers();
    this.transitionToState1();
    this.transitionToState6();
    this.transitionToState7();
    this.transitionToState8();
  }
}
