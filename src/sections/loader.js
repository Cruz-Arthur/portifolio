import SplitType from 'split-type';
import { gsap } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';
import { mountCharacter } from '../components/character.js';

export function initLoader() {
  return new Promise((resolve) => {
    const loader = document.getElementById('loader');
    const top = document.querySelector('.loader-top');
    const bot = document.querySelector('.loader-bot');
    const monogram = document.querySelector('.loader-monogram');
    const stage = document.querySelector('.loader-stage');
    const coordEl = document.querySelector('[data-loader-coord]');
    const charMount = document.querySelector('[data-loader-char]');

    if (!loader || prefersReducedMotion()) {
      if (loader) loader.style.display = 'none';
      resolve();
      return;
    }

    mountCharacter(charMount, 'toon--stand');

    const split = new SplitType(monogram, { types: 'chars' });
    const counter = { v: 0 };

    const finish = () => {
      loader.style.display = 'none';
      document.dispatchEvent(new CustomEvent('loaderDone'));
      resolve();
    };

    gsap.set(split.chars, { yPercent: 120, opacity: 0 });
    gsap.set([charMount, coordEl], { opacity: 0 });

    gsap.timeline()
      // Monogram resolves
      .to(split.chars, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.08 })
      // Coordinate ignition counts up
      .to(coordEl, { opacity: 1, duration: 0.3 }, '<')
      .to(counter, {
        v: 100,
        duration: 1.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (coordEl) coordEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
        },
      }, '<')
      // Explorer appears and crouch-jumps, ready to dive in
      .to(charMount, { opacity: 1, duration: 0.3 }, '-=0.7')
      .to(charMount, { y: 6, duration: 0.16, ease: 'power2.in' })
      .to(charMount, { y: -26, duration: 0.34, ease: 'power2.out' })
      .to(charMount, { y: 0, duration: 0.28, ease: 'power2.in' })
      // Stage lifts away as the world opens
      .to(stage, { opacity: 0, scale: 1.08, duration: 0.5, ease: 'power2.in' }, '-=0.1')
      .to(top, { yPercent: -100, duration: 0.7, ease: 'expo.inOut' }, '-=0.2')
      .to(bot, { yPercent: 100, duration: 0.7, ease: 'expo.inOut', onComplete: finish }, '<');
  });
}
