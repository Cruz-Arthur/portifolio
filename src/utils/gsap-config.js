import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

gsap.defaults({
  ease: 'expo.out',
  duration: 0.9,
});

ScrollTrigger.config({
  ignoreMobileResize: true,
});

// NOTE: do NOT call ScrollTrigger.normalizeScroll() — it hijacks the native
// scroll and fights Lenis, causing janky/locked scrolling. Lenis owns scroll.

export { gsap, ScrollTrigger };
