import { gsap, ScrollTrigger } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';

/**
 * PROJECTS — Solar System of Expeditions
 *
 * Each project is a planet that orbits the central star continuously.
 * A small explorer probe circles the innermost orbit faster than its planet,
 * so it reads as a moon/scout lapping the visited world.
 * Rings draw in via SVG stroke-dashoffset on scroll; planets bloom onto them.
 * Active planet → detail overlay. WIP planets → toast.
 *
 * Orbit model: each planet owns a live `angle`; a perpetual gsap tween advances
 * it and repositions the element from polar coords on every tick. Alternating
 * orbit direction per ring makes the system feel organic rather than mechanical.
 */

const PLANETS = [
  { id: 'tech-innova', angle: 45,  orbitFrac: 0.22, period: 110, dir:  1, detailId: 'detail-tech-innova' },
  { id: 'iris',        angle: 200, orbitFrac: 0.36, period: 158, dir: -1, detailId: 'detail-iris' },
  { id: 'wip-2',       angle: 315, orbitFrac: 0.48, period: 205, dir:  1, detailId: null },
];

function polarToXY(angleDeg, r) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

function baseDim() {
  return Math.min(window.innerWidth, window.innerHeight);
}

export function initProjects(rocket = null) {
  const section = document.getElementById('projects');
  if (!section) return;

  const rings    = section.querySelectorAll('.solar-ring');
  const explorer = section.querySelector('.solar-explorer');
  const toast    = document.getElementById('solar-toast');
  const reduced  = prefersReducedMotion();

  // ── 0. Starfield — bare white pixels scattered behind the system ──
  const scene = section.querySelector('.solar-system');
  if (scene && !section.querySelector('.solar-stars')) {
    const stars = document.createElement('div');
    stars.className = 'solar-stars';
    stars.setAttribute('aria-hidden', 'true');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 90; i++) {
      const star = document.createElement('i');
      const size = Math.random() < 0.8 ? 1 : 2;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.opacity = `${0.25 + Math.random() * 0.6}`;
      // a small fraction twinkle slowly; the rest stay as plain pixels
      if (!reduced && Math.random() < 0.18) {
        star.classList.add('tw');
        star.style.setProperty('--d', `${3 + Math.random() * 4}s`);
      }
      frag.appendChild(star);
    }
    stars.appendChild(frag);
    scene.prepend(stars);
  }

  // Cache element + live state per planet
  const state = PLANETS.map((p) => ({
    ...p,
    el: section.querySelector(`[data-planet="${p.id}"]`),
    a: p.angle,
  }));

  function place(el, angle, orbitFrac) {
    if (!el) return;
    const { x, y } = polarToXY(angle, orbitFrac * baseDim());
    gsap.set(el, { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` });
  }

  // ── 1. Size rings + position everything at current angles ─────
  function layout() {
    rings.forEach((ring, i) => {
      const r = PLANETS[i]?.orbitFrac * baseDim();
      if (!r) return;
      ring.setAttribute('r', r);
      const circ = 2 * Math.PI * r;
      ring.style.strokeDasharray = circ;
      if (!ring._drawn) ring.style.strokeDashoffset = circ;
    });
    // Reposition planets (matters for reduced-motion where no tween runs)
    state.forEach((s) => place(s.el, s.a, s.orbitFrac));
  }

  layout();
  window.addEventListener('resize', layout, { passive: true });

  // ── 2. Continuous planetary orbits ────────────────────────────
  if (!reduced) {
    state.forEach((s) => {
      gsap.to(s, {
        a: s.angle + 360 * s.dir,
        duration: s.period,
        repeat: -1,
        ease: 'none',
        onUpdate() { place(s.el, s.a, s.orbitFrac); },
      });
    });

    // Explorer probe laps the innermost orbit faster than its planet
    if (explorer) {
      const probe = { a: PLANETS[0].angle + 140 };
      gsap.to(probe, {
        a: probe.a + 360,
        duration: 46,
        repeat: -1,
        ease: 'none',
        onUpdate() { place(explorer, probe.a, PLANETS[0].orbitFrac); },
      });
    }
  } else if (explorer) {
    place(explorer, PLANETS[0].angle + 140, PLANETS[0].orbitFrac);
  }

  // ── 3. Scroll reveal: sun ignites → rings draw → planets bloom ─
  const sunEl = section.querySelector('.solar-sun');
  gsap.set(sunEl, { scale: 0, opacity: 0 });
  state.forEach((s) => {
    const body = s.el?.querySelector('.solar-planet-body');
    if (body) gsap.set(body, { scale: 0, opacity: 0 });
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    once: true,
    onEnter() {
      const tl = gsap.timeline();
      tl.to(sunEl, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2.5)' });

      rings.forEach((ring) => {
        ring._drawn = true;
        tl.to(ring, { strokeDashoffset: 0, duration: 1.4, ease: 'expo.out' }, '>-0.5');
      });

      state.forEach((s) => {
        const body = s.el?.querySelector('.solar-planet-body');
        if (body) tl.to(body, { scale: 1, opacity: 1, duration: 0.65, ease: 'back.out(2)' }, '>-0.35');
      });
    },
  });

  // ── 4. Detail overlay ─────────────────────────────────────────
  function openDetail(detailId) {
    const overlay = document.getElementById(detailId);
    if (!overlay) return;
    overlay.classList.add('is-open');
    gsap.fromTo(
      overlay.querySelector('.project-detail-inner'),
      { y: 28, opacity: 0, scale: 0.93 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' },
    );
    overlay.querySelector('.project-detail-close')?.focus();
  }

  function closeDetail(overlay) {
    if (!overlay) return;
    gsap.to(overlay.querySelector('.project-detail-inner'), {
      y: 14,
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'expo.in',
      onComplete() {
        overlay.classList.remove('is-open');
        rocket?.launch();   // the rocket lifts off the planet again
      },
    });
  }

  document.querySelectorAll('.project-detail-close').forEach((btn) => {
    btn.addEventListener('click', () => closeDetail(btn.closest('.project-detail')));
  });

  document.querySelectorAll('.project-detail').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetail(overlay);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.project-detail.is-open').forEach(closeDetail);
  });

  // ── 5. Planet interactions ─────────────────────────────────────
  state.forEach((s) => {
    if (!s.el) return;

    // Pointer hover → rocket enters orbit around this planet
    if (rocket?.enabled) {
      s.el.addEventListener('mouseenter', () => rocket.orbit(s.el));
      s.el.addEventListener('mouseleave', () => rocket.release());
    }

    // Click: with the rocket, land first then open; otherwise open directly.
    s.el.addEventListener('click', () => {
      if (!s.detailId) { showToast(); return; }
      if (rocket?.enabled) rocket.land(s.el, () => openDetail(s.detailId));
      else openDetail(s.detailId);
    });

    // Keyboard stays instant — no one waits on an animation to read content.
    s.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        s.detailId ? openDetail(s.detailId) : showToast();
      }
    });
  });

  // ── 6. Toast for WIP clicks ────────────────────────────────────
  let toastTween = null;
  function showToast() {
    if (!toast) return;
    if (toastTween) toastTween.kill();
    toastTween = gsap.timeline()
      .to(toast, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' })
      .to(toast, { opacity: 0, y: 12, duration: 0.4, ease: 'expo.in', delay: 2 });
  }
}
