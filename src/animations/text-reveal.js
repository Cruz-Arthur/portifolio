import SplitType from 'split-type';
import { gsap, ScrollTrigger } from '../utils/gsap-config.js';

export function revealLines(selector, triggerEl, options = {}) {
  const elements = typeof selector === 'string'
    ? document.querySelectorAll(selector)
    : [selector];

  const splits = [];

  elements.forEach((el) => {
    const split = new SplitType(el, { types: 'lines' });

    // Wrap each line in an overflow-hidden container for clip effect
    split.lines.forEach((line) => {
      const wrap = document.createElement('div');
      wrap.style.overflow = 'hidden';
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
    });

    gsap.from(split.lines, {
      scrollTrigger: {
        trigger: triggerEl || el,
        start: options.start || 'top 85%',
        toggleActions: 'play none none reverse',
        ...(options.scrollTrigger || {}),
      },
      yPercent: 105,
      duration: options.duration || 0.9,
      ease: 'expo.out',
      stagger: options.stagger || 0.1,
    });

    splits.push(split);
  });

  return splits;
}

export function revealChars(selector, triggerEl, options = {}) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return null;

  const split = new SplitType(el, { types: 'chars' });

  gsap.from(split.chars, {
    scrollTrigger: {
      trigger: triggerEl || el,
      start: options.start || 'top 85%',
      toggleActions: 'play none none reverse',
      ...(options.scrollTrigger || {}),
    },
    yPercent: 110,
    rotation: options.rotation !== undefined ? options.rotation : 8,
    duration: options.duration || 0.7,
    ease: 'expo.out',
    stagger: options.stagger || 0.035,
  });

  return split;
}
