import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, OG_IMAGE, absUrl } from './site';

export interface SeoInput {
  title: string; // page title (without site suffix)
  description: string;
  path: string; // route path for canonical, e.g. "/incidents/EWM-001"
  noindex?: boolean;
  type?: 'website' | 'article';
  image?: string;
  jsonLd?: object | object[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Dependency-free document-head manager. Sets title, description, canonical,
// robots, Open Graph / Twitter, and one JSON-LD block per route.
export function useSeo(input: SeoInput) {
  const { title, description, path, noindex, type = 'website', image = OG_IMAGE, jsonLd } = input;
  const key = JSON.stringify(input);

  useEffect(() => {
    const fullTitle = path === '/' ? `${title}` : `${title} · ${SITE_NAME}`;
    const canonical = absUrl(path);

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    // Managed JSON-LD — one script per route, replaced on navigation.
    const existing = document.head.querySelectorAll('script[data-seo-jsonld]');
    existing.forEach((s) => s.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const block of blocks) {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.setAttribute('data-seo-jsonld', '');
        s.textContent = JSON.stringify(block);
        document.head.appendChild(s);
      }
    }

    return () => {
      document.head.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// Shared breadcrumb builder.
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
