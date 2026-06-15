# Arthur Cruz

[**--> Explorar portifólio**](https://arthur-caue.vercel.app/)


> *"Eu crio sistemas que respiram. Onde código e design se encontram para contar histórias que ficam."*

## A Experiência

Este não é um portfólio comum. É uma expedição.

Cada seção é um território a ser explorado, com um personagem que corre sobre planetas, um sistema solar onde cada projeto orbita como um mundo distinto, e um cursor que se transforma em foguete ao entrar na zona de missão.

```
IGNIÇÃO       →  Loader cinematográfico abre a expedição
BASE          →  Hero com retrato em specimen plate + animação por scroll
DIÁRIO        →  Sobre mim com texto revelado por parallax
O WALKER      →  Stack visualizada como planeta vivo com corredor interativo
SISTEMA SOLAR →  Projetos como planetas em órbita contínua
HORIZONTE     →  Contato com o explorador acenando no fim da jornada
```

## Stack

| Camada | Tecnologia |
|:---|:---|
| Build | Vite 8 |
| Motion | GSAP 3.15 + ScrollTrigger + Lenis 1.3 |
| Tipografia | Cormorant Garamond + DM Sans + DM Mono |
| Estilo | SCSS + Design Tokens (CSS custom properties) |
| Runtime | Vanilla JS · zero frameworks, zero overhead |

## Destaques Técnicos

**Cursor foguete**
Dentro da seção de projetos, o cursor padrão cede para uma nave pilotada. State machine completa: `free → orbit → land → landed → launch`. Hover sobre um planeta faz o foguete destacar do ponteiro e entrar em órbita real ao redor do alvo, lendo `getBoundingClientRect()` a cada frame para seguir o planeta em movimento. Clique dispara o pouso com retro-queima. Fechar o card lança a decolagem.

**Sistema solar vivo**
Planetas orbitam o sol de forma contínua, com períodos e direções distintas por anel. Anéis orbitais desenhados com `stroke-dashoffset` na entrada por scroll. Estrelas como pixels puros, sem SVG, sem overhead.

**The Walker**
Personagem stick-figure com cinemática completa (quadris, joelhos, cotovelos) correndo sobre um planeta rotativo. Scroll avança a corrida; voltar ao topo faz o personagem saltar. Reage ao clique com balão de protesto. Poeira rasteja atrás ancorada ao mundo.

**Cursor de lente**
Efeito glass com SVG `feTurbulence` + `feDisplacementMap` animado, criando distorção óptica que segue o ponteiro. `mix-blend-mode: difference` garante visibilidade em qualquer fundo.

**Paleta como sistema**
16+ tokens de cor com escala semântica. Earthy greens exclusivos (`--color-sage`, `--color-moss`, `--color-forest`) para o planeta Tech Innova. Nenhuma cor hardcoded fora dos tokens.

## Rodando Localmente

```bash
git clone https://github.com/Cruz-Arthur/portifolio.git
cd portifolio
npm install
npm run dev
```

Acesse `http://localhost:5173` · role devagar, vale cada frame.

## Projetos no Sistema Solar

| Planeta | Projeto | Stack |
|:---|:---|:---|
| 🟢 | [Tech Innova](https://tech-innova-roan.vercel.app/) | Node.js · TypeScript · Express · Tailwind · Nodemailer |
| 🔵 | Em processo de hospedagem | Em breve |
| 🟤 | Em processo de hospedagem | Em breve |

## Acessibilidade

`prefers-reduced-motion` desativa todas as animações mantendo o conteúdo 100% acessível. `(hover: none)` desativa o cursor foguete e efeitos pointer-only em touch. Navegação completa por teclado, roles ARIA e landmarks semânticos em todas as seções. Contraste de texto ≥ 4.5:1 em toda a paleta.

## Build

```bash
npm run build   # gera /dist pronto para deploy
npm run preview # serve o build local para verificação
```

© 2026 Arthur Cruz · Todos os direitos reservados.
