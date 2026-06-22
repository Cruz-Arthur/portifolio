import { prefersReducedMotion } from '../utils/helpers.js';

/**
 * IRIS PLATFORM SWITCH
 *
 * Iris is one project with two bodies: a native desktop app (PyQt6) and a
 * zero-server browser app (ADR-002 — the desktop engine ported to run entirely
 * in a Web Worker). Rather than scatter them as two unrelated planets, the
 * differentiation lives inside the single Iris detail: a two-state switch swaps
 * the subtitle, description, stack chips and action links between platforms.
 *
 * The Web facet is rendered statically in the HTML so the panel is complete
 * without JS; this module wires the tabs and swaps to the Desktop facet on demand.
 */

const ARROW_ICON =
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const GITHUB_ICON =
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8a4.5 4.5 0 003 4.25c.25.05.34-.1.34-.23v-1.3c-1.25.27-1.5-.6-1.5-.6-.2-.52-.5-.66-.5-.66-.4-.28.03-.27.03-.27.45.03.7.47.7.47.4.7 1.06.5 1.32.38.04-.3.16-.5.3-.62-1-.11-2.05-.5-2.05-2.23 0-.5.18-.9.47-1.21-.05-.12-.2-.58.04-1.2 0 0 .38-.13 1.25.46a4.3 4.3 0 012.28 0c.87-.59 1.25-.46 1.25-.46.24.62.09 1.08.04 1.2.3.31.47.71.47 1.21 0 1.73-1.05 2.12-2.05 2.23.16.14.3.42.3.85v1.26c0 .13.09.28.34.23A4.5 4.5 0 0012.5 8 4.5 4.5 0 008 3.5 4.5 4.5 0 003.5 8z" fill="currentColor"/></svg>';

const VARIANTS = {
  web: {
    subtitle: 'Estação óptica · no navegador',
    desc:
      'A mesma estação óptica, agora 100% no navegador. A inferência roda num Web Worker — ' +
      'YOLO via onnxruntime-web (WebGPU, com WASM de reserva) e leitura por BarcodeDetector ' +
      'nativo ou zxing-wasm. Zero servidor no caminho quente: cada aba usa a própria GPU, ' +
      'então escala sem custo de infraestrutura.',
    tags: ['TypeScript', 'React', 'onnxruntime-web', 'WebGPU', 'Web Worker'],
    links: [
      { label: 'Visitar site', href: 'https://iris-qrdecoder.vercel.app/', primary: true, icon: ARROW_ICON, aria: 'Visitar o Iris Web ao vivo (abre em nova aba)' },
      { label: 'GitHub', href: 'https://github.com/Cruz-Arthur/web_Iris', primary: false, icon: GITHUB_ICON, aria: 'Ver o código do Iris Web no GitHub (abre em nova aba)' },
    ],
  },
  desktop: {
    subtitle: 'Estação óptica · nativa',
    desc:
      'Aplicativo desktop para decodificar QR codes em tempo real via webcam — detecção por IA ' +
      '(YOLO · ONNX Runtime), campo de estrelas interativo, diafragma de íris em 7 lâminas e ' +
      'pipeline de 60 FPS construído inteiramente em PyQt6, sem dependências web.',
    tags: ['Python', 'PyQt6', 'OpenCV', 'ONNX Runtime', 'YOLO'],
    links: [
      { label: 'GitHub', href: 'https://github.com/Cruz-Arthur/desk_Iris', primary: true, icon: GITHUB_ICON, aria: 'Ver o código do Iris Desktop no GitHub (abre em nova aba)' },
    ],
  },
};

function renderTags(container, tags) {
  container.replaceChildren(
    ...tags.map((t) => {
      const span = document.createElement('span');
      span.className = 'project-tag';
      span.textContent = t;
      return span;
    }),
  );
}

function renderLinks(container, links) {
  container.replaceChildren(
    ...links.map((l) => {
      const a = document.createElement('a');
      a.className = 'project-detail-link' + (l.primary ? ' project-detail-link--primary' : '');
      a.href = l.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', l.aria);
      a.innerHTML = `${l.label}${l.icon}`;
      return a;
    }),
  );
}

export function initIrisPlatform() {
  const detail = document.getElementById('detail-iris');
  if (!detail) return;

  const tabs = [...detail.querySelectorAll('.iris-switch-tab')];
  const thumb = detail.querySelector('.iris-switch-thumb');
  const facet = detail.querySelector('.iris-facet');
  const subtitle = detail.querySelector('[data-iris-subtitle]');
  const desc = detail.querySelector('[data-iris-desc]');
  const tagsEl = detail.querySelector('[data-iris-tags]');
  const linksEl = detail.querySelector('[data-iris-links]');
  if (!tabs.length || !facet || !subtitle || !desc || !tagsEl || !linksEl) return;

  const reduced = prefersReducedMotion();
  let current = 'web';
  let swapTimer = null;

  function apply(platform) {
    const v = VARIANTS[platform];
    if (!v) return;
    subtitle.textContent = v.subtitle;
    desc.textContent = v.desc;
    renderTags(tagsEl, v.tags);
    renderLinks(linksEl, v.links);
  }

  function select(platform, { animate = true } = {}) {
    if (platform === current || !VARIANTS[platform]) return;
    current = platform;

    // Thumb slides to the chosen tab; tabs reflect selected state.
    tabs.forEach((t) => {
      const on = t.dataset.platform === platform;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    if (thumb) thumb.style.transform = platform === 'desktop' ? 'translateX(100%)' : 'translateX(0)';

    // Swap the facet body. The crossfade is a pure CSS transition on .iris-facet
    // (independent of any JS animation ticker), so the content is always applied
    // even if motion is reduced or a tween engine stalls.
    if (swapTimer) clearTimeout(swapTimer);
    if (reduced || !animate) {
      apply(platform);
      return;
    }
    facet.classList.add('is-swapping');
    swapTimer = setTimeout(() => {
      apply(platform);
      facet.classList.remove('is-swapping');
      swapTimer = null;
    }, 150);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => select(tab.dataset.platform));
  });

  // Arrow-key navigation between the two tabs (tablist convention).
  const switchEl = detail.querySelector('.iris-switch');
  switchEl?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = current === 'web' ? 'desktop' : 'web';
    select(next);
    detail.querySelector(`.iris-switch-tab[data-platform="${next}"]`)?.focus();
  });
}
