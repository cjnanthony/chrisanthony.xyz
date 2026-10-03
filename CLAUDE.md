# CLAUDE.md: chrisanthony.xyz

Context for any Claude session working in this repo. Read it fully before changing anything. Keep it accurate: if you change how something works, update this file in the same commit.

## What this site is

Chris Anthony's personal site: a link blog plus long-form writing, notes, photos, and book posts. Content is written in Obsidian and published with one hotkey. The design is a warm, retro "e-paper dashboard": cream page, bordered panels, Verdana text.

Guiding principles, in priority order:
1. **Maintainability first.** Chris publishes from Obsidian and should never need to touch code for content. Anything that adds ongoing upkeep is out unless he asks for it.
2. **Obsidian is the source of truth.** Never hand-edit files in the content folder; they're overwritten on every publish.
3. **Simple over clever.** No subtitles/deks, no extra frontmatter, no emoji anywhere on the site.

Link posts follow Simon Willison's approach (https://simonwillison.net/2024/Dec/22/link-blog/): every link post has commentary and its own page.

## Visual reference

`design/mockup/` holds the approved design as plain HTML (open `index.html` in a browser; below 760px wide shows the phone layout). The built site should match it. If a change to the site's look is approved, update the mockup or note the deviation here.

Known deviations from the mockup:
- "Older posts »" appears only when there are more than 20 non-pinned posts, and links to `/archive/` (every post, newest first). The mockup doesn't show this page.
- Gallery figures have no shared caption (the mockup shows "[Gallery caption] · tap a photo…"); each photo's alt text is its alt attribute only. A lone image shows its alt text as the caption.
- Fonts are self-hosted via `@fontsource` packages rather than Google Fonts. Atkinson Hyperlegible, which the mockup loads but doesn't use, is dropped.

## Commands

```
npm install        # install dependencies
npm run dev        # local preview at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Deploys happen automatically: Enveloppe pushes to GitHub, and Cloudflare builds and serves `dist/` on chrisanthony.xyz. Cloudflare setup: Workers with static assets only (no Worker code), configured in `wrangler.jsonc`; Workers Builds runs `npm run build` then `npx wrangler deploy`. Node 22 (`.node-version`; Astro 7 needs >= 22.12).

## Repo layout

```
src/content/blog/        Enveloppe writes here; mirrors Obsidian's Blog/ (never hand-edit)
src/assets/blog/         images uploaded by Enveloppe; notes link to them relatively
src/content.config.ts    collections: `posts` (every */**/*.md except Drafts) and `site` (Site/Sidebar/About.md)
src/lib/site.ts          all derived data: folders + colors, dates, pinned, backlinks
src/lib/links.mjs        URL scheme + link resolution, shared by pages and Markdown plugins
src/lib/remark-links.mjs note-to-note links -> site URLs; unpublished targets -> plain text
src/lib/rehype-figures.mjs image-only paragraphs -> figure / gallery
src/pages/               index, about, archive, [section]/index, [section]/[post], rss.xml, 404
src/styles/global.css    every design token and component style
design/mockup/           approved design (visual source of truth)
```

URLs: `/{folder}/` and `/{folder}/{post}/`, both slugified from the folder and filename (e.g. `Notes/Small tools age well.md` -> `/notes/small-tools-age-well/`). Renaming a note changes its URL.

Markdown runs on the unified (remark/rehype) processor via `@astrojs/markdown-remark`, not Astro 7's default Sätteri, because the two plugins above are remark/rehype plugins.

## How publishing works

1. Chris writes in his Obsidian vault under `Blog/`.
2. The Enveloppe plugin uploads everything in `Blog/` except `Blog/Drafts/` to this repo's content folder, converting `[[wikilinks]]` (links to unpublished notes become plain text) and uploading embedded images. It also removes files that were unpublished.
3. Cloudflare rebuilds on push (about a minute).

Moving a note into a section folder publishes it; moving it to `Drafts/` (or out of `Blog/`) unpublishes it on the next upload. The repo is **public**: anything published stays in git history.

## Content model

```
Blog/
  Site.md      site file: tagline, folder order + colors
  Sidebar.md   site file: sidebar blurb, Elsewhere links
  About.md     site file: bio, work/education, I read, colophon
  Notes/       section
  Books/       section
  Writing/     section
  Photos/      section
  Drafts/      never published
```

- **Folders are sections.** Every folder under `Blog/` except `Drafts` is a section with its own nav item, color, and section page. Adding a folder must require zero code changes.
- **Root-level notes are site files,** never posts. Only the three above are recognized.
- **Post title = filename.** Slug derived from the filename.

### Post properties (all optional)

| Property | Meaning |
|---|---|
| `updated` | Written automatically by the Obsidian plugin "Update Time on Edit" on every save. Default sort and display date. |
| `date` | Manual override of `updated`, for posts that should keep their place. |
| `url` | Makes the note a link post (title links out to this URL). |
| `author` | Optional credit shown on link posts. |
| `pinned` | `true` (or a number for explicit order) pins the post on the homepage. |

**Sort/display date** = `date` ?? `updated`. The displayed day is the first 10 characters of the raw frontmatter value (so `2026-09-30T23:30` shows as 2026-09-30 with no time-zone shifting). The tile banner's "today" is the build date in New York. Do not rely on file modification times: git doesn't preserve them, so every file would look modified at build time. If both properties are missing, fall back to the file's last git commit date. (Caveat: if Cloudflare clones the repo shallowly, every such file gets the same commit date. Notes from Obsidian always have `updated`, so this rarely matters.)

### Site files

`Site.md` properties:
```yaml
tagline: Essays, notes, photos & books, from New York.
folders:            # nav order; color is a palette name or hex
  - { name: Notes,   color: sage }
  - { name: Books,   color: clay }
  - { name: Writing, color: mustard }
  - { name: Photos,  color: plum }
```
Color names: `sage clay mustard plum ochre rose teal green` (the long names `ochre orange`, `dusty rose`, `deep green` also work), or any hex. Folders that exist but aren't listed here go at the end of the nav and get the next unused palette color, assigned deterministically (alphabetical by folder name). The build can't write back to Obsidian, so tell Chris to add new folders to `Site.md` to lock their color and position.

`Sidebar.md`: body is the short blurb. Properties:
```yaml
elsewhere:
  - { label: RSS,    url: /rss.xml }
  - { label: Email,  url: mailto:... }
  - { label: GitHub, url: https://github.com/... }
```

`About.md`: body is the bio (Markdown). Properties:
```yaml
work:
  - { org: Rippling,    role: Analytics engineering manager, payments data, years: "[year]–now" }
  - { org: Kraft Heinz, role: ..., years: ... }
  - { org: PwC,         role: ..., years: ... }
education:
  - { org: Indiana University, detail: Economics & computer science, years: ... }
linkedin: https://www.linkedin.com/in/...
reading:            # the "I read" list (About page only)
  - { name: Terrible Software, url: https://terriblesoftware.org/ }
colophon: Written in Obsidian, built with Astro, hosted on Cloudflare. Set in Young Serif and Verdana.
```

## Features and how they're computed (all at build time, no manual upkeep)

- **Timeline:** all posts across all sections, sorted by sort date, newest first. Pinned posts are shown only in the Pinned group, never duplicated in Latest.
- **Tile banner:** one tile per day, oldest first, filling 3 rows column by column. 138 days on desktop (46 columns), last 60 on phones (20 columns). An empty day shows a dither pattern; a day with posts takes the color of the folder of the most recent post that day.
- **Outline:** the post's `##` headings (from Astro's rendered headings). Hidden if a post has none.
- **Backlinks ("Linked from"):** scan every published post's links to other posts; invert into a per-post list. Hidden if empty.
- **More in {folder}:** the three most recent other posts in the same section.
- **Link posts:** domain shown = hostname of `url` without `www.`.
- **Galleries:** two or more consecutive image-only lines in a note render as a gallery grid (3 columns desktop, 2 on phones). A lone image renders full width. Tapping an image opens it full size. Captions come from alt text.
- **Images:** resized/optimized at build. Photos arrive as WebP at most 2000px wide (converted in Obsidian).
- **RSS:** all posts, newest first, each linking to its page on this site (title, link, date; no body content).

## Design system

### Colors
| Token | Value |
|---|---|
| Page background | `#FCF9EF` with grain: `radial-gradient(rgba(21,21,21,0.14) 0.7px, transparent 0.9px) 0 0 / 3px 3px` |
| Panel background | `#FFFEFA` |
| Ink (text, borders) | `#151515` |
| Muted (dates, meta) | `#4A4945` |
| Image placeholder | `#D4D2CB` |

**Folder palette**, in assignment order:

| # | Name | Hex | Assigned to |
|---|---|---|---|
| 1 | sage | `#4D6B45` | Notes |
| 2 | clay | `#9A4F2C` | Books |
| 3 | mustard | `#D9B44A` | Writing |
| 4 | plum | `#6E4A62` | Photos |
| 5 | ochre orange | `#C98A3E` | next new folder |
| 6 | dusty rose | `#B07A72` | |
| 7 | teal | `#3F7F7A` | |
| 8 | deep green | `#2F5D4C` | |

The palette repeats after eight.

### Type
- **Young Serif:** name in header (38px), post and page titles (32px).
- **Silkscreen:** panel titles only (12px, letter-spacing 0.06em, uppercase).
- **Verdana** (`Verdana, Tahoma, 'DejaVu Sans', sans-serif`) for everything else:
  - list text, sidebar, nav-adjacent text: 15px
  - post body: 16px, line-height 1.75
  - headings inside posts: 20px bold
  - group labels: 12px bold, uppercase, letter-spacing 0.14em
  - dates, captions, meta: 12px, muted
  - nav: 12px bold, uppercase, letter-spacing 0.1em
- **Dates:** always `YYYY-MM-DD`.
- Stick to this scale; don't introduce new sizes.

### Components
- **Panel:** background `#FFFEFA`, `2px solid #151515`, radius 8px, padding 16px 20px 20px. Title row: Silkscreen title, `2px solid` bottom border.
- **Dividers inside panels:** `1px dashed #151515`.
- **Folder square:** 10px, folder color, `1px solid #151515` outline. Used before timeline rows, in section/post panel titles, and (8px) beside the current nav item.
- **Links:** ink color, underlined. Internal links to other posts: dotted underline, 2px. Hover: muted.
- **Quotes:** box with `1px dashed #151515`, italic.
- **Images:** `2px solid #151515` border.
- **Tiles:** square (aspect-ratio 1), gap 3px, radius 2px, inset 1px ink outline. Empty-day dither: `radial-gradient(#151515 0.6px, transparent 0.8px)` on a 4px grid over the panel color, alternating with the same pattern offset 2px 2px.

### Layout
- Max width 1040px, centered; page padding 48px 24px.
- Two columns where a sidebar exists: `2fr 1fr`, gap 18px.
- **Header** (every page): sits on the page background with no panel. Name (links home) and tagline on the left, nav on the right; wraps on small screens.
- **Nav:** ABOUT first, then folders in `Site.md` order. Current item underlined (2px) with its 8px folder square.

### Pages
- **Home:** Posts panel ("POSTS"): tile banner → PINNED group (hidden if none) → dashed divider → LATEST group (rows: folder square, title, domain for link posts, date) → "Older posts »". Sidebar panel titled "ABOUT": blurb with "More »" to About, LAST UPDATED (most recent post date), ELSEWHERE.
- **Section page:** main panel titled with the folder name and its square; post count; one flat list (no year headings). ABOUT sidebar.
- **Post page:** main panel titled with the folder name and its square; title (Young Serif); date; body. Link posts: title links to `url`; meta line `date · by author · domain` (domain links out); body; final bold line "Read the article on {domain} »". Bottom of every post: "« Back to home" (on phones only, a one-line comma-separated "Linked from" sits above it). Sidebar panel titled "INDEX" (sticky): OUTLINE, LINKED FROM (stacked list), MORE IN {FOLDER}; each group hidden when empty. No footer.
- **About page:** no sidebar. One full-width "ABOUT" panel with content capped at 680px: bio, WORK (org bold · role, years right-aligned), EDUCATION, "Full history on LinkedIn »", I READ (one comma-separated line), ELSEWHERE, LAST UPDATED, COLOPHON.

### Phones (max-width 760px)
- Single column. Page padding 14px 10px; panel side padding 14px.
- Home and section pages: sidebar hidden; a compact panel at the bottom shows Updated and Elsewhere.
- Posts: INDEX sidebar hidden; "Linked from" line shows at the bottom of the post; no footer.
- Tile banner shows the last 60 days.
- Galleries: 2 columns.

## Deliberately not included (don't add without asking)

Maps/GPX routes, trip stats, "via" links on link posts, the "I read" list in the sidebar, previous/next post links, footers on post pages, subtitles/deks, comments, analytics, emoji, a separate resume page or PDF.

## Gotchas

- **Dates:** never use file mtimes (see above).
- **Public repo:** unpublishing removes a post from the site but not from git history.
- **Photos:** must arrive with EXIF/GPS stripped; check the Obsidian image settings if location data ever appears.
- **Repo size:** photos are the only heavy content. Keep them WebP ≤2000px; avoid re-uploading the same image repeatedly.
- **Enveloppe:** must exclude `Blog/Drafts/`, convert unpublished links to plain text, auto-merge, and remove unpublished files.
- **New folders:** remind Chris to add them to `Site.md` so their color and nav position are locked.
