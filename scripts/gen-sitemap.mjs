// Generate public/sitemap.xml from static content so every incident and study
// day is a crawlable URL. Run before `vite build` (wired into npm scripts).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SITE = (process.env.VITE_SITE_URL || 'https://ewm.avinashchavan.com').replace(/\/$/, '');

const read = (p) => JSON.parse(readFileSync(resolve(root, 'public/content', p), 'utf-8'));
const incidents = read('incidents.json');
const days = read('qa.json');

const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: '/', priority: '1.0', freq: 'weekly' },
  { loc: '/incidents', priority: '0.9', freq: 'weekly' },
  { loc: '/prep', priority: '0.9', freq: 'weekly' },
  { loc: '/flashcards', priority: '0.6', freq: 'monthly' },
  { loc: '/quiz', priority: '0.6', freq: 'monthly' },
  { loc: '/templates', priority: '0.6', freq: 'monthly' },
  { loc: '/about', priority: '0.4', freq: 'yearly' },
  ...incidents.map((i) => ({ loc: `/incidents/${i.id.toLowerCase()}`, priority: '0.8', freq: 'monthly' })),
  ...days.map((d) => ({ loc: `/prep/day/${d.day}`, priority: '0.8', freq: 'monthly' })),
];

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(resolve(root, 'public/sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs → ${SITE}`);
