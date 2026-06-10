import { gsap } from '../utils/gsap-config.js';
import { getLenis } from '../animations/smooth-scroll.js';

// When locked (e.g. inside the pinned planet scene) the nav stays hidden even
// when scrolling back up — the walker stage should never be covered.
let navLocked = false;
let navEl = null;

export function setNavLock(locked) {
  navLocked = locked;
  if (locked && navEl) {
    gsap.to(navEl, { yPercent: -130, duration: 0.4, ease: 'power2.in' });
  }
}

export function initNav() {
  const nav = document.querySelector('#nav');
  if (!nav) return;
  navEl = nav;

  const links = nav.querySelectorAll('.nav-link');
  let hidden = false;

  // Show/hide based on Lenis scroll direction (reliable — driven by the
  // same engine that owns the scroll). direction: 1 = down, -1 = up.
  const lenis = getLenis();
  if (lenis) {
    lenis.on('scroll', ({ scroll, direction }) => {
      // While locked, force-hide and ignore reveal attempts entirely.
      if (navLocked) {
        if (!hidden) { gsap.to(nav, { yPercent: -130, duration: 0.4 }); hidden = true; }
        return;
      }
      if (direction === 1 && !hidden && scroll > 200) {
        gsap.to(nav, { yPercent: -130, duration: 0.4, ease: 'power2.in' });
        hidden = true;
      } else if (direction === -1 && hidden) {
        gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'expo.out' });
        hidden = false;
      }
      // Always reveal again at the very top
      if (scroll <= 200 && hidden) {
        gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'expo.out' });
        hidden = false;
      }
    });
  }

  // Active section tracking
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.section === id);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((s) => observer.observe(s));

  // Smooth scroll on nav link click
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        const lenis = getLenis();
        lenis?.scrollTo(target, { offset: 0, duration: 1.8, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      }
    });
  });
}
