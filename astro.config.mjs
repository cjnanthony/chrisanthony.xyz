// @ts-check
import { defineConfig } from 'astro/config';
import remarkLinks from './src/lib/remark-links.mjs';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://chrisanthony.xyz',
  output: 'static',
  markdown: {
    remarkPlugins: [remarkLinks],
    rehypePlugins: [rehypeFigures],
  },
});
