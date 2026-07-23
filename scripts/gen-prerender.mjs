// Prerender: write a static HTML file per route with correct <title>, meta,
// canonical, Open Graph and JSON-LD baked into the head — so crawlers that don't
// execute JS still see per-page metadata (the SPA hydrates on top). Runs after
// `vite build`. Mirrors the runtime useSeo() output.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');
const SITE = (process.env.VITE_SITE_URL || 'https://ewm.avinashchavan.com').replace(/\/$/, '');
const SITE_NAME = 'EWM Mastery';
const AUTHOR = 'Avinash Chavan';
const OG_IMAGE = `${SITE}/og-image.png`;

const read = (p) => JSON.parse(readFileSync(resolve(root, 'public/content', p), 'utf-8'));
const incidents = read('incidents.json');
const days = read('qa.json');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
const abs = (p) => `${SITE}${p}`;

const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});

// Route table — title is the per-page title WITHOUT the site suffix.
const routes = [
  {
    path: '/incidents',
    title: 'SAP EWM Support Incidents — 26 Runbooks',
    description:
      'Browse 26 real SAP EWM support incidents by process area, priority and t-code. Each is a full runbook: symptom, system analysis, root cause, resolution and prevention.',
  },
  {
    path: '/prep',
    title: 'SAP EWM 21-Day Interview Prep — 630 Questions',
    description:
      'A structured 21-day SAP EWM interview study plan: 630 questions with model answers across architecture, inbound, outbound, RF, MFS, physical inventory and more.',
  },
  {
    path: '/flashcards',
    title: 'SAP EWM Flashcards',
    description:
      'Build a custom SAP EWM flashcard deck from any of the 21 study days. Flip, self-grade, and requeue the ones you miss. Free and offline.',
  },
  {
    path: '/quiz',
    title: 'SAP EWM Quiz',
    description:
      'Test your SAP EWM knowledge with a 10-question quiz drawn from any of the 21 study days. Reveal answers, self-score, and retake the ones you miss.',
  },
  {
    path: '/templates',
    title: 'SAP EWM Excel Templates — Defect Tracker, Dashboards',
    description:
      'Three free SAP EWM support Excel templates: a Defect Tracker, an Incident Summary Dashboard, and a Governance Report. Download and adapt — no login.',
  },
  {
    path: '/about',
    title: 'About EWM Mastery',
    description:
      'EWM Mastery is a free, offline SAP EWM study app by Avinash Chavan — 26 incident runbooks, 630 interview Q&A, flashcards, quizzes and templates. No login, no tracking.',
  },
  ...incidents.map((i) => ({
    path: `/incidents/${i.id.toLowerCase()}`,
    title: `${i.id}: ${i.title}`,
    description: `SAP EWM ${i.priority}-priority incident runbook (${i.processArea}). ${i.description}`.slice(0, 300),
    type: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: `${i.id}: ${i.title}`,
        about: `SAP EWM ${i.processArea}`,
        articleSection: i.processArea,
        keywords: i.tcodes.join(', '),
        author: { '@type': 'Person', name: AUTHOR },
        description: i.description,
        proficiencyLevel: 'Expert',
      },
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Incidents', path: '/incidents' },
        { name: i.id, path: `/incidents/${i.id.toLowerCase()}` },
      ]),
    ],
  })),
  ...days.map((d) => ({
    path: `/prep/day/${d.day}`,
    title: `Day ${d.day}: ${d.title} — SAP EWM Q&A`,
    description: `Day ${d.day} of SAP EWM interview prep: ${d.questions.length} questions and answers on ${d.title}.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: `SAP EWM interview questions — Day ${d.day}: ${d.title}`,
        mainEntity: d.questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      },
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: '21-Day Prep', path: '/prep' },
        { name: `Day ${d.day}`, path: `/prep/day/${d.day}` },
      ]),
    ],
  })),
];

const template = readFileSync(resolve(dist, 'index.html'), 'utf-8');

function render(route) {
  const fullTitle = `${route.title} · ${SITE_NAME}`;
  const canonical = abs(route.path);
  const type = route.type || 'website';
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = html.replace(
    /(<meta name="description" content=")[\s\S]*?(" \/>)/,
    `$1${esc(route.description)}$2`,
  );
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*("\s*\/>)/,
    `$1${canonical}$2`,
  );
  html = html.replace(/(<meta property="og:title" content=")[\s\S]*?(" \/>)/, `$1${esc(fullTitle)}$2`);
  html = html.replace(
    /(<meta property="og:description" content=")[\s\S]*?(" \/>)/,
    `$1${esc(route.description)}$2`,
  );
  html = html.replace(/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:type" content=")[^"]*(" \/>)/, `$1${type}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[\s\S]*?(" \/>)/, `$1${esc(fullTitle)}$2`);
  html = html.replace(
    /(<meta name="twitter:description" content=")[\s\S]*?(" \/>)/,
    `$1${esc(route.description)}$2`,
  );

  if (route.jsonLd) {
    const blocks = (Array.isArray(route.jsonLd) ? route.jsonLd : [route.jsonLd])
      .map((b) => `<script type="application/ld+json">${jsonLdSafe(b)}</script>`)
      .join('\n    ');
    html = html.replace('</head>', `    ${blocks}\n  </head>`);
  }
  return html;
}

let count = 0;
for (const route of routes) {
  // Flat "<path>.html" (not "<path>/index.html") so Netlify serves it at the
  // extensionless path with a clean 200 — no trailing-slash redirect.
  const outfile = resolve(dist, `${route.path.replace(/^\//, '')}.html`);
  mkdirSync(dirname(outfile), { recursive: true });
  writeFileSync(outfile, render(route));
  count++;
}
console.log(`prerendered ${count} routes`);
