import { gsap } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';

/**
 * IRIS BLOOM
 *
 * On hover/focus of the Iris planet, the animated 7-blade aperture blooms
 * over the planet. The reveal flows outside-to-inside:
 *   1. Outer rim draws its full circumference (stroke-dashoffset sweep)
 *   2. Blade silhouettes materialise
 *   3. Inner aperture opens (center is last to appear)
 *   4. Heptagon ignites; phosphor ring pulses; blades take up slow rotation
 *
 * Geometry is a 1:1 port of web_Iris/IrisAperture.tsx. No MorphSVG —
 * opening is driven by tweening `openness` and recomputing paths each frame.
 */

const N = 7;
const R = 116;       // outer blade radius (SVG units, viewBox 300×300)
const CX = 150;
const CY = 150;
const HALF = Math.PI / N;

const CLOSED = 0.07;
const OPEN   = 0.82;

// Rim circle circumference — used for stroke-dashoffset draw animation.
const RIM_CIRCUM = +(2 * Math.PI * (R + 14)).toFixed(2); // ≈ 816.81

const pt = (r, a) =>
  `${(CX + r * Math.cos(a)).toFixed(2)},${(CY + r * Math.sin(a)).toFixed(2)}`;

function blade(i, openness) {
  const base   = (i * 2 * Math.PI) / N - Math.PI / 2;
  const rInner = Math.max(3, openness * 72);
  const swirl  = (1 - openness) * HALF * 1.1;
  const A = pt(R, base - HALF);
  const B = pt(R, base + HALF);
  const C = pt(rInner, base + HALF * 0.65 + swirl);
  const D = pt(rInner, base - HALF * 0.75 + swirl);
  return `M${A} L${B} L${C} L${D} Z`;
}

function heptagon(r) {
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i * 2 * Math.PI) / N - Math.PI / 2;
    return pt(r, a);
  }).join(' L');
  return `M${pts} Z`;
}

function buildSvg() {
  const blades = Array.from(
    { length: N },
    (_, i) =>
      `<path class="iris-blade" fill="url(#irisBlade)" stroke="#FFB454" stroke-width="0.8" stroke-linejoin="round" opacity="0" d="${blade(i, CLOSED)}" />`,
  ).join('');

  return `
<svg viewBox="0 0 300 300" aria-hidden="true">
  <defs>
    <radialGradient id="irisBody" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#182030" />
      <stop offset="100%" stop-color="#0b1018" />
    </radialGradient>
    <linearGradient id="irisBlade" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#1e2d40" />
      <stop offset="100%" stop-color="#0f1820" />
    </linearGradient>
    <radialGradient id="irisPupil" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2a1c08" />
      <stop offset="60%" stop-color="#060a0e" />
      <stop offset="100%" stop-color="#020406" />
    </radialGradient>
  </defs>

  <circle cx="${CX}" cy="${CY}" r="${R + 18}" fill="url(#irisBody)" />

  <!-- Rim: starts undrawn (dashoffset = full circumference) and sweeps in. -->
  <circle class="iris-rim" cx="${CX}" cy="${CY}" r="${R + 14}"
    fill="none" stroke="#FFB454" stroke-width="2.5"
    stroke-dasharray="${RIM_CIRCUM}" stroke-dashoffset="${RIM_CIRCUM}" />
  <circle cx="${CX}" cy="${CY}" r="${R + 7}"
    fill="none" stroke="rgba(255,180,84,0.25)" stroke-width="1" opacity="0" />

  <g class="iris-blades">${blades}</g>

  <path class="iris-pupil" fill="url(#irisPupil)" d="${heptagon(CLOSED * 72)}" opacity="0" />
  <path class="iris-hepta" fill="none" stroke="#FFB454" stroke-width="2.5" stroke-linejoin="round" d="${heptagon(CLOSED * 72)}" opacity="0" />

  <circle class="iris-pulse" cx="${CX}" cy="${CY}" r="${OPEN * 72 * 0.6}" fill="none" stroke="#4ADE80" stroke-width="2" opacity="0" />
</svg>`;
}

export function initIrisBloom() {
  const planet = document.querySelector('.solar-planet--iris');
  if (!planet || planet.querySelector('.iris-bloom')) return;

  const wrap = document.createElement('span');
  wrap.className = 'iris-bloom';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = buildSvg();
  planet.appendChild(wrap);

  const svg        = wrap.querySelector('svg');
  const bladeGroup = wrap.querySelector('.iris-blades');
  const blades     = [...wrap.querySelectorAll('.iris-blade')];
  const innerRing  = wrap.querySelectorAll('circle')[2]; // the secondary amber ring
  const pupil      = wrap.querySelector('.iris-pupil');
  const hepta      = wrap.querySelector('.iris-hepta');
  const rim        = wrap.querySelector('.iris-rim');
  const pulse      = wrap.querySelector('.iris-pulse');

  const reduced = prefersReducedMotion();
  const state   = { openness: CLOSED };

  function redraw() {
    const r = state.openness * 72;
    blades.forEach((p, i) => p.setAttribute('d', blade(i, state.openness)));
    const h = heptagon(r);
    pupil.setAttribute('d', h);
    hepta.setAttribute('d', h);
  }

  // Resting: collapsed and invisible. Scale stays at 1 — we reveal by drawing, not scaling.
  gsap.set(svg, { opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(bladeGroup, { rotation: 0, transformOrigin: '50% 50%', svgOrigin: '150 150' });

  let enterTl = null;
  let leaveTl = null;
  let spin    = null;
  let open    = false;

  function enter() {
    if (open) return;
    open = true;
    leaveTl?.kill();

    if (reduced) {
      state.openness = OPEN;
      redraw();
      gsap.set(svg, { opacity: 1 });
      gsap.set([rim, hepta, pupil, innerRing, ...blades], { opacity: 1 });
      gsap.set(rim, { attr: { 'stroke-dashoffset': 0 } });
      return;
    }

    enterTl = gsap.timeline();
    enterTl
      // 1. Wrapper fades in immediately so the dark body is the backdrop.
      .to(svg, { opacity: 1, duration: 0.18, ease: 'none' }, 0)

      // 2. Outer rim draws its full circumference — outside edge arrives first.
      .to(rim, { attr: { 'stroke-dashoffset': 0 }, duration: 0.5, ease: 'power2.inOut' }, 0)

      // 3. Secondary amber inner ring fades in with the rim.
      .to(innerRing, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.08)

      // 4. Blades materialise — they're already at their outer radius (R),
      //    so they appear outer-edge-first. Inner aperture opens simultaneously.
      .to(blades, { opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.03 }, 0.2)
      .to(state, {
        openness: OPEN,
        duration: 0.8,
        ease: 'power3.inOut',
        onUpdate: redraw,
      }, 0.2)

      // 5. Pupil and heptagon reveal last — the innermost layer.
      .to([pupil, hepta], { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.6)

      // 6. Phosphor decode-ring flares as the aperture reaches open.
      .fromTo(
        pulse,
        { attr: { r: OPEN * 72 * 0.5 }, opacity: 0.85 },
        { attr: { r: OPEN * 72 * 1.7 }, opacity: 0, duration: 0.9, ease: 'power2.out' },
        0.7,
      )

      // 7. Slow perpetual rotation while held open.
      .add(() => {
        spin = gsap.to(bladeGroup, {
          rotation: '+=360',
          duration: 26,
          ease: 'none',
          repeat: -1,
          transformOrigin: '50% 50%',
          svgOrigin: '150 150',
        });
      }, 0.85);
  }

  function leave() {
    if (!open) return;
    open = false;
    enterTl?.kill();
    spin?.kill();
    spin = null;

    if (reduced) {
      state.openness = CLOSED;
      redraw();
      gsap.set(svg, { opacity: 0 });
      gsap.set(rim, { attr: { 'stroke-dashoffset': RIM_CIRCUM } });
      return;
    }

    leaveTl = gsap.timeline({
      onComplete() {
        // Reset rim so it can draw again on next enter.
        gsap.set(rim, { attr: { 'stroke-dashoffset': RIM_CIRCUM } });
      },
    });
    leaveTl
      .to([pupil, hepta], { opacity: 0, duration: 0.2 }, 0)
      .to(state, { openness: CLOSED, duration: 0.4, ease: 'power2.inOut', onUpdate: redraw }, 0)
      .to(blades, { opacity: 0, duration: 0.3, ease: 'power2.in', stagger: 0.02 }, 0.05)
      .to([innerRing], { opacity: 0, duration: 0.25 }, 0.1)
      .to(svg, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.2);
  }

  planet.addEventListener('mouseenter', enter);
  planet.addEventListener('mouseleave', leave);
  planet.addEventListener('focusin',    enter);
  planet.addEventListener('focusout',   leave);
}
