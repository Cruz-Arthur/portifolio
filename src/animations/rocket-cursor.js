import { gsap } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';

/**
 * ROCKET CURSOR — only inside #projects (the solar system).
 *
 * State machine:
 *   free    → follows the pointer, nose to velocity, embers when moving
 *   orbit   → detaches from pointer, circles the hovered planet, always thrusting
 *   land    → spirals onto the planet's north pole, retro-burn downward, then opens
 *   landed  → parked on the planet (hidden under the detail overlay)
 *   launch  → lifts off the planet, then hands control back to the pointer
 *
 * Planets orbit the sun, so the rocket reads the planet's LIVE rect every frame
 * to stay glued while orbiting/landing/launching.
 *
 * Returns a controller for projects.js to drive: orbit / release / land / launch.
 * Returns null on touch + reduced-motion (default cursor stays untouched).
 */

const ROCKET_SVG = `
<svg viewBox="0 0 24 40" fill="none" aria-hidden="true">
  <path d="M12 1 C7 7, 5.5 15, 6 24 L6.5 30 L17.5 30 L18 24 C18.5 15 17 7 12 1 Z"
        fill="#FAFAF8" stroke="#1A1A1A" stroke-width="0.6"/>
  <circle cx="12" cy="15" r="3" fill="#1A1A1A"/>
  <circle cx="12" cy="15" r="3" fill="none" stroke="#C4956A" stroke-width="0.8"/>
  <path d="M6 23 L1.5 32 L6.5 30 Z" fill="#C4956A"/>
  <path d="M18 23 L22.5 32 L17.5 30 Z" fill="#C4956A"/>
  <path d="M9 30 L12 36 L15 30 Z" fill="#8AA86A"/>
</svg>`;

const LAND_MS   = 760;
const LAUNCH_MS = 700;

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn  = (t) => t * t * t;
function lerpAngle(a, b, t) {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

function planetGeo(el) {
  const body = el.querySelector('.solar-planet-body') || el;
  const r = body.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: r.width / 2 };
}

export function initRocketCursor() {
  const section = document.getElementById('projects');
  if (!section) return null;
  if (prefersReducedMotion()) return null;
  if (window.matchMedia('(hover: none)').matches) return null;

  // ── Rocket + particle pools ───────────────────────────────────
  const rocket = document.createElement('div');
  rocket.className = 'rocket-cursor';
  rocket.setAttribute('aria-hidden', 'true');
  rocket.innerHTML = ROCKET_SVG;
  document.body.appendChild(rocket);

  const EMBERS = 40, STREAKS = 12;
  const emberPool = [], streakPool = [];
  for (let i = 0; i < EMBERS; i++) {
    const e = document.createElement('div');
    e.className = 'rocket-ember';
    document.body.appendChild(e);
    emberPool.push(e);
  }
  for (let i = 0; i < STREAKS; i++) {
    const s = document.createElement('div');
    s.className = 'rocket-streak';
    document.body.appendChild(s);
    streakPool.push(s);
  }
  let emberI = 0, streakI = 0;

  function spawnEmber(x, y, dx, dy, speed) {
    const el = emberPool[emberI = (emberI + 1) % EMBERS];
    const tailX = x - dx * 16, tailY = y - dy * 16;
    const drift = 10 + Math.min(speed, 30);
    const size = 4 + Math.random() * 4;
    const jx = (Math.random() - 0.5) * 8, jy = (Math.random() - 0.5) * 8;
    gsap.killTweensOf(el);
    gsap.set(el, { x: tailX, y: tailY, opacity: 0.9, scale: 1, width: size, height: size });
    gsap.to(el, {
      x: tailX - dx * drift + jx, y: tailY - dy * drift + jy,
      opacity: 0, scale: 0.2, duration: 0.45 + Math.random() * 0.2, ease: 'power2.out',
    });
  }

  function spawnStreak(x, y, dx, dy, speed) {
    const el = streakPool[streakI = (streakI + 1) % STREAKS];
    const len = 14 + Math.min(speed * 1.4, 40);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const bx = x - dx * 18 + (Math.random() - 0.5) * 14;
    const by = y - dy * 18 + (Math.random() - 0.5) * 14;
    gsap.killTweensOf(el);
    gsap.set(el, { x: bx, y: by, rotation: ang, width: len, opacity: 0.55 });
    gsap.to(el, { x: bx - dx * 42, y: by - dy * 42, opacity: 0, duration: 0.3, ease: 'power2.out' });
  }

  // ── State ─────────────────────────────────────────────────────
  let mx = 0, my = 0;        // pointer target
  let px = 0, py = 0;        // rocket position
  let angle = -90;           // heading deg (nose up at rest)
  let active = false;        // pointer inside section
  let mode = 'free';
  let target = null;         // orbited/landed planet element
  let orbitA = 0;            // current orbit angle (rad)
  let progT = 0;            // land/launch progress (ms accumulator)
  let startRelX = 0, startRelY = 0, startAngle = -90;
  let landCb = null;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  section.addEventListener('mouseenter', () => {
    px = mx; py = my;
    active = true;
  });
  section.addEventListener('mouseleave', () => { active = false; });

  // ── Flight loop ───────────────────────────────────────────────
  gsap.ticker.add((time, dt) => {
    const modalOpen = !!document.querySelector('.project-detail.is-open');

    // While the card is open the rocket is parked out of sight, and the
    // default cursor returns so the user can click links/close.
    if (modalOpen) {
      document.body.classList.remove('piloting');
      rocket.style.opacity = '0';
      return;
    }

    const visible = active || mode === 'launch';
    if (!visible) {
      document.body.classList.remove('piloting');
      rocket.style.opacity = '0';
      if (mode === 'orbit') mode = 'free';
      return;
    }

    document.body.classList.add('piloting');
    rocket.style.opacity = '1';

    if (mode === 'free') {
      const nx = px + (mx - px) * 0.35;
      const ny = py + (my - py) * 0.35;
      const vx = nx - px, vy = ny - py;
      px = nx; py = ny;
      const speed = Math.hypot(vx, vy);
      if (speed > 0.6) {
        angle = lerpAngle(angle, Math.atan2(vy, vx) * 180 / Math.PI + 90, 0.3);
        const dx = vx / speed, dy = vy / speed;
        spawnEmber(px, py, dx, dy, speed);
        if (speed > 10) spawnStreak(px, py, dx, dy, speed);
      }
    }

    else if (mode === 'orbit' && target) {
      const { cx, cy, radius } = planetGeo(target);
      const r = radius + 16;
      orbitA += dt * 0.0029;               // ~2.2s per revolution
      px = cx + Math.cos(orbitA) * r;
      py = cy + Math.sin(orbitA) * r;
      // tangent heading + continuous propulsion
      const dx = -Math.sin(orbitA), dy = Math.cos(orbitA);
      angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      spawnEmber(px, py, dx, dy, 14);
    }

    else if (mode === 'land' && target) {
      progT += dt;
      const p = easeOut(Math.min(progT / LAND_MS, 1));
      const { cx, cy, radius } = planetGeo(target);
      const relX = lerp(startRelX, 0, p);
      const relY = lerp(startRelY, -(radius + 4), p);
      px = cx + relX; py = cy + relY;
      angle = lerpAngle(startAngle, 0, p);
      spawnEmber(px, py, 0, -1, 18);        // retro-burn down onto the surface
      if (progT >= LAND_MS) {
        mode = 'landed';
        const cb = landCb; landCb = null;
        if (cb) cb();
      }
    }

    else if (mode === 'landed' && target) {
      const { cx, cy, radius } = planetGeo(target);
      px = cx; py = cy - (radius + 4);
      angle = 0;
    }

    else if (mode === 'launch' && target) {
      progT += dt;
      const p = easeIn(Math.min(progT / LAUNCH_MS, 1));
      const { cx, cy, radius } = planetGeo(target);
      px = cx;
      py = cy - (radius + 4) - p * 200;     // shoots straight up
      angle = 0;
      spawnEmber(px, py, 0, -1, 16 + p * 20);
      if (progT >= LAUNCH_MS) { mode = 'free'; target = null; }
    }

    gsap.set(rocket, { x: px, y: py, rotation: angle });
  });

  // ── Controller ────────────────────────────────────────────────
  return {
    enabled: true,
    orbit(el) {
      if (mode === 'land' || mode === 'landed' || mode === 'launch') return;
      target = el;
      const { cx, cy } = planetGeo(el);
      orbitA = Math.atan2(py - cy, px - cx);  // start where the rocket is
      mode = 'orbit';
    },
    release() {
      if (mode === 'orbit') { mode = 'free'; target = null; }
    },
    land(el, onLanded) {
      if (mode !== 'orbit' && mode !== 'free') return;
      target = el;
      landCb = onLanded;
      const { cx, cy } = planetGeo(el);
      startRelX = px - cx; startRelY = py - cy; startAngle = angle;
      progT = 0;
      mode = 'land';
    },
    launch() {
      if (mode !== 'landed') return;
      progT = 0;
      mode = 'launch';
    },
  };
}
