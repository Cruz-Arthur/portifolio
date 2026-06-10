import { gsap, ScrollTrigger } from '../utils/gsap-config.js';
import { prefersReducedMotion } from '../utils/helpers.js';
import { setNavLock } from '../components/nav.js';

export function initSkills() {
  const section = document.getElementById('skills');
  if (!section) return;
  if (prefersReducedMotion()) return; // CSS shows the static fallback list

  const scene = section.querySelector('[data-scene]');
  const walker = section.querySelector('[data-walker]');
  const rig = section.querySelector('[data-rig]');
  const bubble = section.querySelector('[data-bubble]');
  const bubbleText = section.querySelector('[data-bubble-text]');
  const dust = section.querySelector('[data-dust]');
  const stacks = gsap.utils.toArray('.stack');
  if (!scene || !walker || !rig || !stacks.length) return;

  stacks.forEach((s) => s.style.setProperty('--a', `${s.dataset.angle}deg`));

  // Multi-joint limbs. svgOrigin = the joint each segment pivots around.
  const J = {
    armF:  section.querySelector('[data-arm-f]'),
    foreF: section.querySelector('[data-fore-f]'),
    armB:  section.querySelector('[data-arm-b]'),
    foreB: section.querySelector('[data-fore-b]'),
    legF:  section.querySelector('[data-leg-f]'),
    shinF: section.querySelector('[data-shin-f]'),
    legB:  section.querySelector('[data-leg-b]'),
    shinB: section.querySelector('[data-shin-b]'),
  };
  const SHOULDER = '40 34', ELBOW = '40 50', HIP = '40 66', KNEE = '40 90';

  // .walker owns position/flip/jump/dodge; .walker-rig owns the run-lean.
  gsap.set(walker, { xPercent: -50, yPercent: -100, scaleX: 1 });
  const leanTo = gsap.quickTo(rig, 'rotation', { duration: 0.4, ease: 'power2.out' });

  const TURN = 360, STRIDES = 16, VIS_BAND = 58;

  let facing = 1, lastDir = 1, busy = false, prevSwing = 0, active = false;

  // ── Dust pool: reused puffs that drift opposite the run direction ──
  const PUFFS = 14;
  const pool = [];
  if (dust) {
    for (let i = 0; i < PUFFS; i++) {
      const p = document.createElement('span');
      p.className = 'dust-puff';
      dust.appendChild(p);
      gsap.set(p, { opacity: 0 });
      pool.push(p);
    }
  }
  let puffIdx = 0;
  const spawnPuff = () => {
    if (!pool.length) return;
    const p = pool[puffIdx = (puffIdx + 1) % pool.length];
    const dir = -facing; // opposite the movement
    gsap.killTweensOf(p);
    gsap.fromTo(p,
      { x: facing * -4, y: 0, opacity: 0.55, scale: 0.4 },
      {
        x: dir * gsap.utils.random(46, 78),
        y: gsap.utils.random(-26, -8),
        opacity: 0,
        scale: gsap.utils.random(1.0, 1.6),
        duration: gsap.utils.random(0.55, 0.85),
        ease: 'power2.out',
      }
    );
  };

  // ── Jump (shared by direction-flip and the spacebar) ──
  const doJump = (flip, dir) => {
    if (busy) return;
    if (flip) facing = dir;
    busy = true;
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(walker, { y: -46, duration: 0.24, ease: 'power2.out' });
    if (flip) tl.to(walker, { scaleX: facing, duration: 0.01 }, 0.18);
    tl.to(walker, { y: 0, duration: 0.32, ease: 'power2.in' })
      .to(walker, { scaleY: 0.86, duration: 0.08, ease: 'power2.out' }, '>-0.02')
      .to(walker, { scaleY: 1, duration: 0.2, ease: 'back.out(2.2)' });
  };

  // ── Censored manga protest (insult body, then "!!!" pushed to the end) ──
  const SWEARS = ['#@*$', '%$#&@', '$#@%', '@#$&%', '#%@$&', '&@#$%', '@#$%*&'];
  let swearIdx = 0;
  let bubbleTimer;
  const protest = () => {
    if (!bubble || !bubbleText) return;
    const body = SWEARS[swearIdx = (swearIdx + 1) % SWEARS.length];
    const bangs = '!'.repeat(gsap.utils.random(3, 5, 1));
    bubbleText.textContent = `${body}  ${bangs}`;
    bubble.classList.add('is-on');
    gsap.fromTo(bubble,
      { scale: 0, opacity: 0, y: 6 },
      { scale: 1, opacity: 1, y: 0, duration: 0.34, ease: 'back.out(2.6)' }
    );
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      gsap.to(bubble, {
        scale: 0.85, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => bubble.classList.remove('is-on'),
      });
    }, 1300);
  };

  // ── Dodge: a quick sidestep + lean-back when poked ──
  const dodge = () => {
    if (busy) { protest(); return; }
    busy = true;
    // Canonical recoil: step back (-x) and lean back (-rot). scaleX mirrors
    // it so he always recoils away from his direction of travel.
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to(walker, { x: -26, duration: 0.14, ease: 'power3.out' })
      .to(rig, { rotation: -24, duration: 0.14, ease: 'power3.out' }, '<')
      .to(walker, { y: -14, duration: 0.16, ease: 'power2.out' }, '<')
      .to(walker, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
      .to(rig, { rotation: 8, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, '<');
    protest();
  };

  walker.addEventListener('click', dodge);
  walker.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); dodge(); }
  });

  // Spacebar jumps — only while the scene is active, and we swallow the
  // default page-scroll so the jump doesn't fight the browser.
  window.addEventListener('keydown', (e) => {
    if (!active) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      doJump(false, facing);
    }
  });

  // ── Frame: planet spin, stack rise/set, run cycle, lean, dust ──
  const render = (p, dir, vel) => {
    const rot = -(p * TURN);
    scene.style.setProperty('--rot', `${rot}deg`);

    stacks.forEach((s) => {
      const a = parseFloat(s.dataset.angle);
      const delta = ((a + rot) % 360 + 540) % 360 - 180;
      const vis = Math.max(0, 1 - Math.abs(delta) / VIS_BAND);
      s.style.opacity = Math.pow(vis, 1.4);
      s.style.setProperty('--s', (0.82 + vis * 0.28).toFixed(3));
    });

    // Run cycle — authored canonically for RIGHTWARD travel; the parent
    // scaleX mirrors it for leftward, so the math itself stays facing-agnostic.
    //
    // SVG is y-down (positive rotation = clockwise). A downward limb's foot
    // sits at (-L·sinθ, L·cosθ): NEGATIVE θ throws the foot FORWARD (+x),
    // positive θ drives it back. That sign is what was inverted before —
    // the lead leg was kicking backward, so he ran like a moonwalker.
    const phase = p * STRIDES * Math.PI * 2;
    const swing = Math.sin(phase);     // front-leg phase: >0 ⇒ front leg forward
    const speed = Math.min(1, Math.abs(vel) / 2600);

    if (!busy) {
      // Run gait. Legs swing in antiphase; the knee flexes on the recovery
      // (rear) swing. Arms oppose the same-side leg (contralateral).
      const KNEE_BASE = 7; // resting flex so legs read as legs, not stilts
      gsap.set(J.legF,  { rotation: -swing * 34, svgOrigin: HIP });
      gsap.set(J.legB,  { rotation:  swing * 34, svgOrigin: HIP });
      gsap.set(J.shinF, { rotation: KNEE_BASE + Math.max(0, -swing) * 60, svgOrigin: KNEE });
      gsap.set(J.shinB, { rotation: KNEE_BASE + Math.max(0,  swing) * 60, svgOrigin: KNEE });
      gsap.set(J.armF,  { rotation:  swing * 26, svgOrigin: SHOULDER });
      gsap.set(J.armB,  { rotation: -swing * 26, svgOrigin: SHOULDER });
      gsap.set(J.foreF, { rotation: -(42 + Math.max(0,  swing) * 22), svgOrigin: ELBOW });
      gsap.set(J.foreB, { rotation: -(42 + Math.max(0, -swing) * 22), svgOrigin: ELBOW });
      // Forward lean into the run; scaleX mirrors it for leftward travel.
      leanTo(6 + speed * 16);
    }

    // Emit a dust puff on each foot-plant (swing zero-crossing) while moving.
    if (speed > 0.06 && prevSwing <= 0 && swing > 0) spawnPuff();
    prevSwing = swing;

    if (dir && dir !== lastDir) {
      doJump(true, dir === 1 ? 1 : -1);
      lastDir = dir;
    }
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=3200',
    pin: scene,
    scrub: 0.8,
    anticipatePin: 1,
    onToggle: (self) => {
      active = self.isActive;
      setNavLock(self.isActive); // header stays hidden across the whole stage
    },
    onUpdate: (self) => render(self.progress, self.direction, self.getVelocity()),
  });

  render(0, 1, 0);
}
