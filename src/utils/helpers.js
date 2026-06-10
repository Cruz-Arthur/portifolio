export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (min, max, v) => Math.min(Math.max(v, min), max);

export const mapRange = (inMin, inMax, outMin, outMax, v) => {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
};

export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
