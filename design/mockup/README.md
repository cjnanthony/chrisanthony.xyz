# Mockup: chrisanthony.xyz

The approved final design, as plain HTML. Open any file in a browser; links between pages work.
This is the visual source of truth: the built site should match it.

| File | Page |
|---|---|
| index.html | Home: tile banner, Pinned, Latest timeline, ABOUT sidebar |
| section.html | Section page (shown as Books; same template for every folder) |
| post.html | Post (essay) with the INDEX sidebar: Outline, Linked from, More in folder |
| link-post.html | Link post (title links out, byline, quote, "Read the article on ... »") |
| photo-post.html | Post with a single photo and a gallery |
| about.html | About page (no sidebar): bio, Work, Education, I read, Elsewhere, Colophon |

Notes:
- Narrow the browser window below 760px to see the phone layout (sidebar becomes a small footer panel on Home/section pages; INDEX hides on posts; banner shows 60 days).
- Text in [brackets] is placeholder content. Gray bars stand in for body paragraphs. "photo" boxes stand in for images.
- The tile banner uses sample data; the real site computes it from post dates and folders.
- Fonts (Young Serif, Silkscreen) load from Google Fonts; offline they fall back to system fonts.
- Exact tokens and rules are in CLAUDE.md. Where this mockup and CLAUDE.md disagree, ask Chris.
