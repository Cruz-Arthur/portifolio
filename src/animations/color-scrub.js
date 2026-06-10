import { gsap, ScrollTrigger } from '../utils/gsap-config.js';

export function createColorScrub(triggerEl, fromColor, toColor, options = {}) {
  const target = options.target || document.body;
  const prop = options.prop || 'backgroundColor';

  ScrollTrigger.create({
    trigger: triggerEl,
    start: options.start || 'top center',
    end: options.end || 'bottom center',
    scrub: options.scrub ?? 1,
    onUpdate(self) {
      const progress = self.progress;
      const from = gsap.utils.splitColor(fromColor);
      const to = gsap.utils.splitColor(toColor);
      const r = Math.round(from[0] + (to[0] - from[0]) * progress);
      const g = Math.round(from[1] + (to[1] - from[1]) * progress);
      const b = Math.round(from[2] + (to[2] - from[2]) * progress);
      target.style.setProperty(options.cssVar || '--section-bg', `rgb(${r},${g},${b})`);
    },
  });
}
