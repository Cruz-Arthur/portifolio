import { gsap } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';

/**
 * Reactive heading effect: as the pointer moves over a heading, the text tilts
 * in 3D toward the cursor and gains a subtle chromatic-aberration split — it
 * feels like looking at the text through moving glass. Parent-level transform,
 * so it never conflicts with child line/char reveal animations.
 */
export function initInteractiveText(
  selector = '.hero-headline, .about-quote, .project-title, .contact-headline, .skills-name'
) {
  if (prefersReducedMotion()) return;

  const els = document.querySelectorAll(selector);

  els.forEach((el) => {
    el.style.willChange = 'transform';
    gsap.set(el, { transformPerspective: 600, transformOrigin: 'center center' });

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'expo.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'expo.out' });

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      rotY(px * 16);    // horizontal pointer -> Y tilt
      rotX(-py * 16);   // vertical pointer  -> X tilt

      // Chromatic-aberration split scales with how far the pointer is pushed.
      const offset = Math.round(Math.abs(px) * 6) + 1;
      el.style.textShadow =
        `${offset}px 0 rgba(196,149,106,0.35), ${-offset}px 0 rgba(26,26,26,0.18)`;
    });

    el.addEventListener('pointerleave', () => {
      rotX(0);
      rotY(0);
      el.style.textShadow = 'none';
    });
  });
}
