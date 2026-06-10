import { gsap, ScrollTrigger } from '../utils/gsap-config.js';

export function createParallax(imageEl, containerEl, options = {}) {
  const from = options.from ?? -15;
  const to = options.to ?? 15;
  const scrub = options.scrub ?? 1.5;

  gsap.fromTo(
    imageEl,
    { yPercent: from },
    {
      yPercent: to,
      ease: 'none',
      scrollTrigger: {
        trigger: containerEl || imageEl,
        start: 'top bottom',
        end: 'bottom top',
        scrub,
      },
    }
  );
}
