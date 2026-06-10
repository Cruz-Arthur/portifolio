/**
 * The character — single source of truth for the little explorer that threads
 * through the whole site. Same figure as the skills "walker" (same stroke
 * weight, proportions, joints) so every cameo reads as the same person.
 *
 * Cameos are posed/animated purely in CSS via a pose class on the mount
 * (`char--point`, `char--wave`, `char--walk`, `char--stand`). The skills
 * section keeps its own inline SVG because it's driven procedurally by scroll.
 */

export const CHARACTER_SVG = `
<svg class="char-svg" viewBox="0 0 80 130" fill="none" aria-hidden="true">
  <circle class="wk-head" cx="40" cy="14" r="8" />
  <line class="wk-body" x1="40" y1="22" x2="40" y2="66" />
  <g class="ch-arm ch-arm-b"><line class="wk-limb" x1="40" y1="34" x2="40" y2="50" />
    <g class="ch-fore"><line class="wk-limb wk-limb--thin" x1="40" y1="50" x2="40" y2="64" /></g>
  </g>
  <g class="ch-leg ch-leg-b"><line class="wk-limb" x1="40" y1="66" x2="40" y2="90" />
    <g class="ch-shin"><line class="wk-limb" x1="40" y1="90" x2="40" y2="108" /></g>
  </g>
  <g class="ch-leg ch-leg-f"><line class="wk-limb" x1="40" y1="66" x2="40" y2="90" />
    <g class="ch-shin"><line class="wk-limb" x1="40" y1="90" x2="40" y2="108" /></g>
  </g>
  <g class="ch-arm ch-arm-f"><line class="wk-limb" x1="40" y1="34" x2="40" y2="50" />
    <g class="ch-fore"><line class="wk-limb wk-limb--thin" x1="40" y1="50" x2="40" y2="64" /></g>
  </g>
</svg>`;

/** Inject the character into a mount element with an optional pose class.
 *  Uses the `toon` namespace (NOT `char` — that collides with SplitType's
 *  per-character spans and would break text reveals site-wide). */
export function mountCharacter(el, pose = 'toon--stand') {
  if (!el) return null;
  el.classList.add('toon', pose);
  el.innerHTML = CHARACTER_SVG;
  return el;
}
