import SplitType from 'split-type';
import { gsap, ScrollTrigger } from '../utils/gsap-config.js';
import { revealLines } from '../animations/text-reveal.js';
import { mountCharacter } from '../components/character.js';

export function initAbout() {
  const section = document.getElementById('about');
  if (!section) return;

  const pullQuote = section.querySelector('.about-quote');
  const bio = section.querySelectorAll('.about-bio p');
  const deco = section.querySelector('.about-deco-char');

  // Explorer resting in the journal's margin
  const aboutChar = mountCharacter(section.querySelector('[data-about-char]'), 'toon--stand');
  if (aboutChar) {
    gsap.from(aboutChar, {
      opacity: 0, y: 24, duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: aboutChar, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  }

  // NO pinning. The section scrolls freely — the user is always in control.
  // Reveals play once on enter; nothing traps or gates the scroll.

  // Pull-quote: word-by-word reveal that PLAYS THROUGH on enter (time-based,
  // not scroll-scrubbed) so reading never depends on scroll position.
  if (pullQuote) {
    const split = new SplitType(pullQuote, { types: 'words' });
    gsap.set(split.words, { opacity: 0.12, yPercent: 20 });

    gsap.to(split.words, {
      opacity: 1,
      yPercent: 0,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: {
        trigger: pullQuote,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Decorative giant character: free parallax drift + gentle rotation tied to
  // scroll progress, but the section is never pinned — pure ambient motion.
  if (deco) {
    gsap.fromTo(deco,
      { yPercent: -12, rotation: -4 },
      {
        yPercent: 12,
        rotation: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
  }

  // Bio paragraphs reveal on enter
  if (bio.length) {
    revealLines(bio, section, {
      start: 'top 75%',
      stagger: 0.1,
    });
  }
}
