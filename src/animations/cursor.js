import { gsap } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';

export function initCursor() {
  const ring = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');
  const lens = document.querySelector('.cursor-lens');

  if (!ring || !dot) return;

  const reduced = prefersReducedMotion();
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(dot, { x: mouseX, y: mouseY, duration: 0, overwrite: true });
  });

  // Ring + lens lag behind the dot via lerp (lens lags more = liquid feel)
  let rx = 0, ry = 0, lx = 0, ly = 0;
  gsap.ticker.add(() => {
    rx += (mouseX - rx) * 0.18;
    ry += (mouseY - ry) * 0.18;
    gsap.set(ring, { x: rx, y: ry });

    if (lens && !reduced) {
      lx += (mouseX - lx) * 0.10;
      ly += (mouseY - ly) * 0.10;
      gsap.set(lens, { x: lx, y: ly });
    }
  });

  // Magnetic expand on interactive elements
  const targets = document.querySelectorAll('a, button, .project-card, .cursor-magnetic');
  targets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(ring, { scale: 2.6, duration: 0.4, ease: 'expo.out' });
      gsap.to(dot, { scale: 0, duration: 0.3 });
      // Lens stays at its fixed diameter — only the ring reacts on hover.
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(ring, { scale: 1, duration: 0.4, ease: 'expo.out' });
      gsap.to(dot, { scale: 1, duration: 0.3 });
    });
  });

  // Show/hide everything when the pointer enters/leaves the window
  const show = () => gsap.to([ring, dot], { opacity: 1, duration: 0.3 });
  const hide = () => gsap.to([ring, dot, lens], { opacity: 0, duration: 0.3 });

  document.addEventListener('mouseleave', hide);
  document.addEventListener('mouseenter', show);

  // Reveal the glass lens only while the pointer is actually moving — idle
  // glass looks like a stuck artifact; moving glass feels alive.
  if (lens && !reduced) {
    let idleTimer;
    document.addEventListener('mousemove', () => {
      gsap.to(lens, { opacity: 1, duration: 0.4, overwrite: 'auto' });
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        gsap.to(lens, { opacity: 0, duration: 0.8 });
      }, 600);
    });
  }
}
