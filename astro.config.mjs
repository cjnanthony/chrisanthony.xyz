// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkLinks from './src/lib/remark-links.mjs';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://chrisanthony.xyz',
  output: 'static',
  markdown: {
    // The remark/rehype pipeline rather than Astro 7's default (Sätteri),
    // because our two Markdown plugins are remark/rehype plugins.
    processor: unified({
      remarkPlugins: [remarkLinks],
      rehypePlugins: [rehypeFigures],
    }),
  },
});
