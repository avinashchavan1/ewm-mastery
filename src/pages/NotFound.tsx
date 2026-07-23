import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export default function NotFound() {
  useSeo({
    title: 'Page not found',
    description: 'That route does not exist in EWM Mastery.',
    path: '/404',
    noindex: true,
  });
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="font-mono text-sm text-text2">404</div>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-text2">That route doesn’t exist in EWM Mastery.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary no-underline hover:bg-primary-strong"
      >
        ← Back home
      </Link>
    </div>
  );
}
