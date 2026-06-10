import { gsap, ScrollTrigger } from '../utils/gsap-config.js';
import { revealLines } from '../animations/text-reveal.js';
import { createParallax } from '../animations/image-parallax.js';
import { mountCharacter } from '../components/character.js';

export function initHero() {
  const section = document.getElementById('hero');
  if (!section) return;

  // Explorer pointing down — invites the scroll
  mountCharacter(section.querySelector('[data-hero-char]'), 'toon--point');

  const headline = section.querySelectorAll('.hero-headline');
  const sub = section.querySelector('.hero-sub');
  const ctaWrap = section.querySelector('.hero-cta-wrap');
  const ctaLine = section.querySelector('.hero-cta-line');
  const portrait = section.querySelector('.hero-portrait');

  // Headline line reveal (fires after loaderDone via main.js delay)
  revealLines(headline, section, {
    start: 'top 90%',
    stagger: 0.12,
    duration: 1,
  });

  // Sub fade in
  if (sub) {
    gsap.from(sub, {
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      yPercent: 20,
      duration: 1,
      delay: 0.4,
    });
  }

  // CTA wrapper line draw
  if (ctaLine) {
    gsap.fromTo(ctaLine,
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: 1.2,
        ease: 'expo.out',
        delay: 0.8,
      }
    );
  }

  if (ctaWrap) {
    gsap.from(ctaWrap, {
      opacity: 0,
      yPercent: 15,
      duration: 0.9,
      ease: 'expo.out',
      delay: 1.0,
    });
  }

  // Portrait scale parallax: zoom out as hero scrolls away
  if (portrait) {
    gsap.fromTo(portrait,
      { scale: 1.15 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
  }

  // Scroll indicator fade out
  const scrollHint = section.querySelector('.hero-scroll-hint');
  if (scrollHint) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '20% top',
      scrub: true,
      onUpdate: (self) => {
        scrollHint.style.opacity = 1 - self.progress * 2;
      },
    });
  }
}
