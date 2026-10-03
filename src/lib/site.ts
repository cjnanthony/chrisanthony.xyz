// Everything the pages need, computed once per build from the content folder.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { folderUrl, hrefToKey, postUrl, titleKey } from './links.mjs';

export const PALETTE: Record<string, string> = {
  sage: '#4D6B45',
  clay: '#9A4F2C',
  mustard: '#D9B44A',
  plum: '#6E4A62',
  ochre: '#C98A3E',
  rose: '#B07A72',
  teal: '#3F7F7A',
  green: '#2F5D4C',
};
// Aliases so Site.md can use the long names too.
const COLOR_ALIASES: Record<string, string> = { 'ochre orange': 'ochre', 'dusty rose': 'rose', 'deep green': 'green' };

export const TIMEZONE = 'America/New_York';
export const LATEST_COUNT = 20;

export interface Folder { name: string; url: string; color: string }

export interface Post {
  id: string;
  entry: CollectionEntry<'posts'>;
  title: string;
  folder: Folder;
  url: string;
  date: string;        // YYYY-MM-DD, as written in the note
  sortKey: number;     // full timestamp, for ordering
  pinned: number | null;
  linkUrl?: string;
  author?: string;
  domain?: string;
}

// Today in New York, as YYYY-MM-DD.
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());

// The date a note shows and sorts by: `date`, else `updated`, else the file's
// last git commit. We read the raw frontmatter text so "2026-09-30T23:30" shows
// as 2026-09-30 regardless of time zone parsing.
function noteDate(entry: CollectionEntry<'posts'>): { date: string; sortKey: number } {
  const raw = entry.filePath ? fs.readFileSync(entry.filePath, 'utf8') : '';
  const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  for (const field of ['date', 'updated']) {
    const value = front.match(new RegExp(`^${field}:\\s*["']?([^"'\\r\\n]+)`, 'm'))?.[1]?.trim();
    const day = value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (value && day) {
      const parsed = Date.parse(value);
      return { date: day, sortKey: Number.isNaN(parsed) ? Date.parse(day) : parsed };
    }
  }
  let iso = '';
  try {
    iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', entry.filePath!], { encoding: 'utf8' }).trim();
  } catch {}
  const when = iso ? new Date(iso) : new Date();
  return {
    date: new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(when),
    sortKey: when.getTime(),
  };
}

function resolveColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const c = color.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(c)) return color.trim();
  return PALETTE[COLOR_ALIASES[c] ?? c];
}

// Nav order and colors: folders listed in Site.md first, in that order, then
// any other folders alphabetically. Unlisted (or uncolored) folders take the
// next unused palette color; the palette repeats once all eight are used.
function buildFolders(listed: { name: string; color?: string }[], present: string[]): Folder[] {
  const names = [...listed.map((f) => f.name)];
  for (const name of [...present].sort((a, b) => a.localeCompare(b))) if (!names.includes(name)) names.push(name);
  const explicit = new Map(listed.map((f) => [f.name, resolveColor(f.color)]));
  const used = new Set([...explicit.values()].filter(Boolean));
  const palette = Object.values(PALETTE);
  let next = 0;
  const nextColor = () => {
    const unused = palette.filter((c) => !used.has(c));
    const color = unused.length ? unused[0] : palette[next++ % palette.length];
    used.add(color);
    return color;
  };
  return names.map((name) => ({ name, url: folderUrl(name), color: explicit.get(name) ?? nextColor() }));
}

const domainOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return undefined; }
};

let cache: ReturnType<typeof load> | undefined;
export const getSite = () => (cache ??= load());

async function load() {
  const [entries, siteFile, sidebarFile, aboutFile] = await Promise.all([
    getCollection('posts'),
    getEntry('site', 'Site'),
    getEntry('site', 'Sidebar'),
    getEntry('site', 'About'),
  ]);

  const folderOf = (id: string) => id.split('/')[0];
  const titleOf = (id: string) => id.split('/').pop()!;
  const folders = buildFolders(siteFile?.data.folders ?? [], [...new Set(entries.map((e) => folderOf(e.id)))]);
  const folderByName = new Map(folders.map((f) => [f.name, f]));

  const posts: Post[] = entries.map((entry) => {
    const title = titleOf(entry.id);
    const { pinned, url, author } = entry.data;
    return {
      id: entry.id,
      entry,
      title,
      folder: folderByName.get(folderOf(entry.id))!,
      url: postUrl(folderOf(entry.id), title),
      ...noteDate(entry),
      pinned: pinned === true ? Infinity : typeof pinned === 'number' ? pinned : null,
      linkUrl: url,
      author,
      domain: url ? domainOf(url) : undefined,
    };
  });
  posts.sort((a, b) => b.sortKey - a.sortKey || a.title.localeCompare(b.title));

  // Pinned: numbered pins in ascending order, then `pinned: true` by date.
  const pinned = posts.filter((p) => p.pinned !== null).sort((a, b) => a.pinned! - b.pinned! || b.sortKey - a.sortKey);

  // Backlinks: scan each post's Markdown for links to other posts.
  const byKey = new Map(posts.map((p) => [titleKey(p.title), p]));
  const backlinks = new Map<string, Post[]>();
  for (const source of posts) {
    const body = source.entry.body ?? '';
    const targets = new Set<Post>();
    for (const m of body.matchAll(/\]\(\s*<?([^)\s>]+)>?/g)) {
      const key = hrefToKey(m[1]);
      if (key && byKey.has(key)) targets.add(byKey.get(key)!);
    }
    for (const m of body.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) {
      const target = byKey.get(titleKey(m[1]));
      if (target) targets.add(target);
    }
    for (const target of targets) {
      if (target === source) continue;
      backlinks.set(target.id, [...(backlinks.get(target.id) ?? []), source]);
    }
  }

  return {
    tagline: siteFile?.data.tagline ?? '',
    folders,
    posts,
    pinned,
    latest: posts.filter((p) => p.pinned === null),
    lastUpdated: posts[0]?.date ?? '',
    backlinksOf: (post: Post) => backlinks.get(post.id) ?? [],
    sidebar: sidebarFile,
    about: aboutFile,
    elsewhere: sidebarFile?.data.elsewhere ?? [],
  };
}
