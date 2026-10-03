import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CONTENT_DIR, EXCLUDED_FOLDERS } from './lib/links.mjs';

// Ids are the file path without ".md" (e.g. "Notes/Some note"), so the folder
// and title (= filename) can be read straight from them.
const keepPath = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const dateish = z.union([z.date(), z.string()]).optional();

// Every note inside a folder of Blog/, except Drafts.
const posts = defineCollection({
  loader: glob({
    pattern: ['*/**/*.md', ...EXCLUDED_FOLDERS.map((f) => `!${f}/**`)],
    base: CONTENT_DIR,
    generateId: keepPath,
  }),
  schema: z.object({
    updated: dateish,
    date: dateish,
    url: z.string().url().optional(),
    author: z.string().optional(),
    pinned: z.union([z.boolean(), z.number()]).optional(),
  }),
});

const link = z.object({ label: z.string(), url: z.string() });

// Notes directly in Blog/: Site.md, Sidebar.md, About.md.
const site = defineCollection({
  loader: glob({ pattern: ['Site.md', 'Sidebar.md', 'About.md'], base: CONTENT_DIR, generateId: keepPath }),
  schema: z.object({
    tagline: z.string().optional(),
    folders: z.array(z.object({ name: z.string(), color: z.string().optional() })).optional(),
    elsewhere: z.array(link).optional(),
    work: z.array(z.object({ org: z.string(), role: z.string().optional(), years: z.string().optional() })).optional(),
    education: z.array(z.object({ org: z.string(), detail: z.string().optional(), years: z.string().optional() })).optional(),
    linkedin: z.string().optional(),
    reading: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
    colophon: z.string().optional(),
  }),
});

export const collections = { posts, site };
