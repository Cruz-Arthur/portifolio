import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../utils/gsap-config.js';

let lenis;

export function initSmoothScroll() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  // CRITICAL: feed Lenis scroll position to ScrollTrigger on every scroll.
  // Without this, all pins/scrubs/triggers use stale positions — sections
  // appear to "trap" the scroll and nav direction detection never fires.
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // CRITICAL: must be 0 — GSAP lag smoothing breaks Lenis timing
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis() {
  return lenis;
}
