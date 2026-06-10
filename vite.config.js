import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  css: {
    devSourcemap: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('gsap')) return 'gsap';
          if (id.includes('lenis')) return 'lenis';
        },
      },
    },
  },
});
