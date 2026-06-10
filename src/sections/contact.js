import { gsap, ScrollTrigger } from '../utils/gsap-config.js';
import { mountCharacter } from '../components/character.js';

export function initContact() {
  const section = document.getElementById('contact');
  if (!section) return;

  const headline = section.querySelector('.contact-headline');
  const emailEl = section.querySelector('.contact-email');
  const socials = section.querySelectorAll('.social-link');

  // Explorer reaches the horizon, turns, and waves goodbye
  const contactChar = mountCharacter(section.querySelector('[data-contact-char]'), 'toon--wave');
  if (contactChar) {
    contactChar.classList.add('toon--light');
    gsap.from(contactChar, {
      opacity: 0, x: -40, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
    });
  }

  // Headline clip-path wipe left-to-right
  if (headline) {
    gsap.fromTo(headline,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  // Email typewriter effect
  if (emailEl) {
    const fullText = emailEl.dataset.email || emailEl.textContent.trim();
    emailEl.textContent = '';

    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        const chars = fullText.split('');
        chars.forEach((char, i) => {
          gsap.to({}, {
            duration: 0.05 * i,
            onComplete: () => {
              emailEl.textContent += char;
            },
          });
        });
      },
    });
  }

  // Social links stagger
  if (socials.length) {
    gsap.from(socials, {
      yPercent: 20,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }
}
