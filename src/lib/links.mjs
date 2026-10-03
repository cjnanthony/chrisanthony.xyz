// Shared link helpers. Used by the Markdown plugins (astro.config.mjs) and by
// the page code (src/lib/site.ts), so both agree on URLs and link resolution.
import fs from 'node:fs';
import path from 'node:path';
import { slug } from 'github-slugger';

export const CONTENT_DIR = 'src/content/blog';
export const EXCLUDED_FOLDERS = ['Drafts'];

export const folderUrl = (folder) => `/${slug(folder)}/`;
export const postUrl = (folder, title) => `/${slug(folder)}/${slug(title)}/`;

// Key used to match a link target to a post: the filename without ".md",
// lowercased. Obsidian filenames are unique enough for this to be reliable.
export const titleKey = (title) => title.trim().toLowerCase();

// Turn a link target (Markdown href or wikilink target) into a title key,
// or null if it is not a link to a note.
export function hrefToKey(href) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) return null;
  let target = href.split('#')[0].split('?')[0];
  try { target = decodeURIComponent(target); } catch {}
  target = target.replace(/^<|>$/g, '');
  if (!target.toLowerCase().endsWith('.md')) return null;
  return titleKey(path.basename(target, path.extname(target)));
}

// Every published post on disk: Map<titleKey, url>. Read from the filesystem
// so the Markdown plugins can use it before Astro's collections exist.
export function scanPosts() {
  const map = new Map();
  if (!fs.existsSync(CONTENT_DIR)) return map;
  for (const dir of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory() || EXCLUDED_FOLDERS.includes(dir.name)) continue;
    for (const file of fs.readdirSync(path.join(CONTENT_DIR, dir.name), { recursive: true })) {
      if (!file.endsWith('.md')) continue;
      const title = path.basename(file, '.md');
      map.set(titleKey(title), postUrl(dir.name, title));
    }
  }
  return map;
}
