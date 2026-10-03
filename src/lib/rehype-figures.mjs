// Turns image-only paragraphs into figures.
// - Two or more consecutive images (one per line) become a gallery grid.
// - A lone image becomes a full-width figure with its alt text as caption.
// Each image is wrapped in a link that opens it full size (href filled in by
// a small script in the post page, since Astro rewrites image URLs later).

const isBlank = (n) => n.type === 'text' && !n.value.trim();
const isImg = (n) => n.type === 'element' && n.tagName === 'img';
const imageOnly = (n) =>
  n.type === 'element' && n.tagName === 'p' &&
  n.children.some(isImg) && n.children.every((c) => isImg(c) || isBlank(c) || (c.type === 'element' && c.tagName === 'br'));

const el = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });

// Obsidian embeds without a caption (![[photo.webp]]) arrive with the filename
// as alt text, and ![[photo.webp|300]] with a width. Neither is a caption.
const captionOf = (img) => {
  const alt = String(img.properties.alt ?? '').trim();
  return /\.(webp|png|jpe?g|gif|avif|svg|heic)$/i.test(alt) || /^\d+(x\d+)?$/.test(alt) ? '' : alt;
};
const zoom = (img) => el('a', { className: ['zoom'] }, [img]);

export default function rehypeFigures() {
  return (tree) => {
    const out = [];
    const nodes = tree.children;
    for (let i = 0; i < nodes.length; i++) {
      if (!imageOnly(nodes[i])) { out.push(nodes[i]); continue; }
      const imgs = [];
      let j = i;
      while (j < nodes.length && (imageOnly(nodes[j]) || isBlank(nodes[j]))) {
        if (imageOnly(nodes[j])) imgs.push(...nodes[j].children.filter(isImg));
        j++;
      }
      i = j - 1;
      for (const img of imgs) img.properties.alt = captionOf(img);
      if (imgs.length === 1) {
        const alt = imgs[0].properties.alt;
        out.push(el('figure', {}, [zoom(imgs[0]), ...(alt ? [el('figcaption', {}, [{ type: 'text', value: alt }])] : [])]));
      } else {
        out.push(el('figure', {}, [el('div', { className: ['gallery'] }, imgs.map(zoom))]));
      }
      out.push({ type: 'text', value: '\n' });
    }
    tree.children = out;
  };
}
