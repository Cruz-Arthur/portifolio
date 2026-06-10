import './styles/main.scss';

import { initSmoothScroll } from './animations/smooth-scroll.js';
import { initCursor } from './animations/cursor.js';
import { initRocketCursor } from './animations/rocket-cursor.js';
import { initInteractiveText } from './animations/interactive-text.js';
import { initLoader } from './sections/loader.js';
import { initHero } from './sections/hero.js';
import { initAbout } from './sections/about.js';
import { initSkills } from './sections/skills.js';
import { initProjects } from './sections/projects.js';
import { initContact } from './sections/contact.js';
import { initNav } from './components/nav.js';
import { initMagneticButtons } from './components/magnetic-button.js';
import { ScrollTrigger } from './utils/gsap-config.js';
import { prefersReducedMotion } from './utils/helpers.js';

function initSections() {
  // Rocket cursor must exist before projects so it can be handed in
  const rocket = initRocketCursor();

  initHero();
  initAbout();
  initSkills();
  initProjects(rocket);
  initContact();
  initNav();
  initMagneticButtons();
  initCursor();
  initInteractiveText();

  // Recalculate scroll positions after all images load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}

async function init() {
  // Smooth scroll must start first
  initSmoothScroll();

  // Nav scroll class
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Run loader then init everything
  await initLoader();
  initSections();
}

init();
