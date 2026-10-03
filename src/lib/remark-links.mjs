// Rewrites links between notes to their URLs on this site.
// - Markdown links to "Some Note.md" (what Enveloppe produces) point to the post's page.
// - Leftover [[wikilinks]] are handled the same way, in case any slip through.
// - Links to notes that aren't published become plain text.
// Internal links get the "internal" class (dotted underline).
import { visit, SKIP } from 'unist-util-visit';
import { hrefToKey, scanPosts, titleKey } from './links.mjs';

const WIKILINK = /(?<!!)\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

export default function remarkLinks() {
  return (tree) => {
    const posts = scanPosts();
    const internal = (url, children) => ({
      type: 'link', url, children, data: { hProperties: { className: ['internal'] } },
    });

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !node.value.includes('[[')) return;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(WIKILINK)) {
        const [whole, target, , alias] = m;
        parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        const label = { type: 'text', value: (alias ?? target).trim() };
        const url = posts.get(titleKey(target));
        parts.push(url ? internal(url, [label]) : label);
        last = m.index + whole.length;
      }
      if (!parts.length) return;
      parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts.filter((p) => p.type !== 'text' || p.value));
      return [SKIP, index + parts.length];
    });

    visit(tree, 'link', (node, index, parent) => {
      const key = hrefToKey(node.url);
      if (!key || !parent) return;
      const url = posts.get(key);
      if (url) {
        Object.assign(node, internal(url, node.children));
      } else {
        parent.children.splice(index, 1, ...node.children);
        return [SKIP, index];
      }
    });
  };
}
