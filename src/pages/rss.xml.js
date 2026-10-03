import rss from '@astrojs/rss';
import { getSite } from '../lib/site';

export async function GET(context) {
  const { posts, tagline } = await getSite();
  return rss({
    title: 'Chris Anthony',
    description: tagline || 'Chris Anthony',
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      link: post.url,
      pubDate: new Date(post.sortKey),
    })),
  });
}
