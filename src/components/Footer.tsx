import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-shell flex-col gap-2 px-4 py-6 text-[13px] text-text2 sm:flex-row sm:items-center sm:px-6">
        <span className="flex items-center gap-2">
          <LogoMark size={18} className="flex-none" />© Avinash Chavan — EWM Mastery
        </span>
        <span className="hidden sm:inline">·</span>
        <span>Free, offline, no login.</span>
        <span className="flex-1" />
        <Link to="/about" className="font-semibold no-underline hover:text-primary">
          About &amp; disclaimer
        </Link>
      </div>
    </footer>
  );
}
