import { gsap } from './gsap-config.js';

let mm;

export function getMediaQuery() {
  if (!mm) mm = gsap.matchMedia();
  return mm;
}

export const breakpoints = {
  mobile:  '(max-width: 767px)',
  tablet:  '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
};
