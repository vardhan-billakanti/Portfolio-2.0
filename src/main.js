// Global Styles Architecture
import './styles/variables.css';
import './styles/typography.css';
import './styles/global.css';
import './styles/nav.css';
import './styles/canvas.css';
import './styles/hero.css';
import './styles/transition.css';
import './styles/cursor.css';
import './styles/bob.css';
import './styles/about.css';
import './styles/academics.css';
import './styles/toolkit.css';
import './styles/projects.css';
import './styles/about-intro.css';
import './styles/certifications.css';
import './styles/lorven.css';
import './styles/founders.css';
import './styles/contact.css';
import './styles/footer.css';

// Core Motion & Performance Foundation
import { motionEngine } from './core/motion-engine.js';
import { attachHoverPhysics } from './core/hover-physics.js';
import { textMotionSystem } from './core/text-motion.js';

// Visual & Motion Components
import { RadialStreakCanvas } from './components/radial-canvas.js';
import { HeroParallaxController } from './components/hero-parallax.js';
import { HeroSequenceOrchestrator } from './components/hero-sequence.js';
import { NavigationController } from './components/navigation.js';
import { CustomCursorController } from './components/custom-cursor.js';
import { AboutIntroController } from './components/about-intro.js';
import { AboutExperienceController } from './components/about-section.js';
import { AcademicsExperienceController } from './components/academics-section.js';
import { ToolkitExperienceController } from './components/toolkit-section.js';
import { ProjectsSectionController } from './components/projects-section.js';
import { CertificationsExperienceController } from './components/certifications-section.js';
import { LorvenSectionController } from './components/lorven-section.js';
import { FoundersSectionController } from './components/founders-section.js';
import { ContactSectionController } from './components/contact-section.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. PRIMARY STAGE (Critical Path: Cursor, Hero Visuals, Navigation)
  const cursorElement = document.getElementById('custom-cursor');
  if (cursorElement) {
    new CustomCursorController(cursorElement);
  }

  // Initialize Radial Streak Engine
  const canvasElement = document.getElementById('radial-canvas');
  const canvasEngine = canvasElement ? new RadialStreakCanvas(canvasElement) : null;

  // Initialize Hero Multi-Layer Depth Parallax & Scroll Transition
  new HeroParallaxController();

  // Cache DOM references for the hero sequence
  const sequenceElements = {
    singularity: document.getElementById('hero-singularity'),
    firstName: document.getElementById('hero-first-name'),
    lastName: document.getElementById('hero-last-name'),
    nav: document.getElementById('site-nav'),
    contentWrapper: document.getElementById('hero-content-wrapper'),
    bobLauncher: document.getElementById('bob-floating-wrapper') || document.getElementById('node-floating-wrapper')
  };

  // Initialize Hero Opening Sequence (States 1 to 8)
  const orchestrator = new HeroSequenceOrchestrator(canvasEngine, sequenceElements);
  orchestrator.start();

  // Initialize Minimal Navigation with Smooth Scrolling & ScrollSpy
  const navElement = document.getElementById('site-nav');
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  new NavigationController(navElement, mobileToggle, mobileDrawer);

  // 2. SECONDARY STAGE (Initialized progressively to keep boot time fast & 60fps)
  const initSecondarySections = () => {
    // Initialize Cinematic Pre-About Scroll Transition Experience
    new AboutIntroController();

    // Initialize Futuristic About Section Experience
    new AboutExperienceController();

    // Initialize Futuristic Academics Trajectory Experience
    new AcademicsExperienceController();

    // Initialize Futuristic 3D Orbital Toolkit Command Center
    new ToolkitExperienceController();

    // Initialize Selected Works Projects Section (homepage 3-col grid)
    new ProjectsSectionController();

    // Initialize Authentic Certifications Fanned Deck Experience
    new CertificationsExperienceController();

    // Initialize Lorven Enterprise 3D Scroll-Storytelling Experience
    new LorvenSectionController();

    // Initialize Lorven Enterprise Founders Experience
    new FoundersSectionController();

    // Initialize Futuristic Contact Section & Footer Experience
    new ContactSectionController();

    // Attach subtle, tactile hover physics to key interactive components
    if (!motionEngine.isTouch && !motionEngine.prefersReducedMotion) {
      // Subtle magnetic pull on CTA & social buttons
      attachHoverPhysics('.nav-contact-capsule', { magnetic: 0.18, maxMagneticOffset: 5 });
      attachHoverPhysics('.hero-social-circle', { magnetic: 0.22, maxMagneticOffset: 6 });

      // Subtle 3D perspective tilt on project cards & founder cards
      attachHoverPhysics('.project-card', { tilt: 4.5, spotlight: true });
      attachHoverPhysics('.founder-member-card', { tilt: 4.0, spotlight: true });
    }
  };

  // Use requestIdleCallback if available, fallback to fast timeout
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initSecondarySections, { timeout: 300 });
  } else {
    setTimeout(initSecondarySections, 40);
  }

  // Quick skip sequence on spacebar if user wants immediate access
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !orchestrator.isCompleted) {
      orchestrator.skipToSettled();
    }
  });

  // Lazy-load BOB assistant on demand (zero initial overhead)
  let bobAssistantInstance = null;
  let isLoadingBob = false;

  async function openBobAssistant(triggerElement) {
    if (!bobAssistantInstance && !isLoadingBob) {
      isLoadingBob = true;
      try {
        const { getBobAssistant } = await import('./components/bob-panel.js');
        bobAssistantInstance = getBobAssistant();
      } catch (err) {
        console.error('Failed to load BOB assistant:', err);
      } finally {
        isLoadingBob = false;
      }
    }

    if (bobAssistantInstance) {
      bobAssistantInstance.open(triggerElement);
    }
  }

  // Attach BOB trigger (floating robot icon)
  const floatingBobBtn = document.getElementById('bob-trigger-floating') || document.getElementById('node-trigger-floating');
  if (floatingBobBtn) {
    floatingBobBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openBobAssistant(floatingBobBtn);
    });
  }
});
