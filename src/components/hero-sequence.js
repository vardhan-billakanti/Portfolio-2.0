/**
 * Hero Sequence Orchestrator
 * Drives the clean 8-state cinematic opening sequence:
 * State 1: Pure black void
 * State 2: Central focal ignition
 * State 3: Soft radial line emergence
 * State 4: High-speed outward acceleration burst
 * State 5: Full radial expansion
 * State 6: Name typography reveal (Syne 800)
 * State 7: BILLAKANTI JAYA VARDHAN locks into center
 * State 8: Settles into fast, smooth ambient cruise (1.8x) with subtle subline & CTAs
 */

export class HeroSequenceOrchestrator {
  constructor(canvasEngine, elements) {
    this.canvas = canvasEngine;
    this.elements = elements;
    this.currentState = 1;
    this.isCompleted = false;
  }

  start() {
    // STATE 1 (0ms): Void black screen
    this.transitionToState1();

    // STATE 2 (250ms): Central subtle ignition point
    setTimeout(() => {
      this.transitionToState2();
    }, 250);

    // STATE 3 (600ms): Radial streaks softly emerge
    setTimeout(() => {
      this.transitionToState3();
    }, 600);

    // STATE 4 (1100ms): Outward acceleration surge
    setTimeout(() => {
      this.transitionToState4();
    }, 1100);

    // STATE 5 (1650ms): High-velocity radial expansion
    setTimeout(() => {
      this.transitionToState5();
    }, 1650);

    // STATE 6 (2200ms): Name typography begins revealing
    setTimeout(() => {
      this.transitionToState6();
    }, 2200);

    // STATE 7 (2850ms): Name locks authoritatively into center
    setTimeout(() => {
      this.transitionToState7();
    }, 2850);

    // STATE 8 (3400ms): Settles into ambient cruise and reveals clean UI
    setTimeout(() => {
      this.transitionToState8();
    }, 3400);
  }

  transitionToState1() {
    this.currentState = 1;
    this.canvas.setGlobalAlpha(0);
    this.canvas.setSpeed(1.0, true);
  }

  transitionToState2() {
    this.currentState = 2;
    if (this.elements.singularity) {
      this.elements.singularity.classList.add('active');
    }
  }

  transitionToState3() {
    this.currentState = 3;
    this.canvas.setGlobalAlpha(0.45);
    this.canvas.setSpeed(2.2);
  }

  transitionToState4() {
    this.currentState = 4;
    this.canvas.setGlobalAlpha(0.90);
    this.canvas.setSpeed(6.5);
    if (this.elements.singularity) {
      this.elements.singularity.classList.remove('active');
      this.elements.singularity.classList.add('faded');
    }
  }

  transitionToState5() {
    this.currentState = 5;
    this.canvas.setGlobalAlpha(1.0);
    this.canvas.setSpeed(8.0);
  }

  transitionToState6() {
    this.currentState = 6;
    this.canvas.setSpeed(3.8);

    if (this.elements.firstName) {
      this.elements.firstName.classList.add('revealed');
    }
    setTimeout(() => {
      if (this.elements.lastName) {
        this.elements.lastName.classList.add('revealed');
      }
    }, 150);
  }

  transitionToState7() {
    this.currentState = 7;
    this.canvas.setSpeed(2.6);
  }

  transitionToState8() {
    this.currentState = 8;
    this.isCompleted = true;

    // Settle into fast, continuous ambient cruise
    this.canvas.setSpeed(2.2);

    if (this.elements.nav) {
      this.elements.nav.classList.remove('nav-hidden');
      this.elements.nav.classList.add('nav-visible');
    }

    if (this.elements.contentWrapper) {
      this.elements.contentWrapper.classList.add('settled');
    }

    const launcher = this.elements.bobLauncher || this.elements.nodeLauncher;
    if (launcher) {
      launcher.classList.remove('launcher-hidden');
      launcher.classList.add('launcher-visible');
    }
  }

  skipToSettled() {
    if (this.isCompleted) return;
    this.transitionToState1();
    this.transitionToState6();
    this.transitionToState7();
    this.transitionToState8();
  }
}
