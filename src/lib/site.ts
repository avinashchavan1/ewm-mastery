// Canonical origin for SEO tags + sitemap. Override at build with VITE_SITE_URL.
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://ewm.avinashchavan.com'
).replace(/\/$/, '');

export const SITE_NAME = 'EWM Mastery';
export const SITE_TAGLINE = 'SAP EWM Support & Interview Prep';
export const AUTHOR = 'Avinash Chavan';

export const absUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const OG_IMAGE = absUrl('/og-image.png');

// Netlify serves lowercase paths (it 301s mixed-case URLs to lowercase), so all
// incident URLs use the lowercased id. Display id (EWM-004) stays uppercase.
export const incidentPath = (id: string) => `/incidents/${id.toLowerCase()}`;
