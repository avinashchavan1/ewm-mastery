import { NavLink } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import { Logo } from './Logo';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/incidents', label: 'Incidents' },
  { to: '/prep', label: '21-Day Prep' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/templates', label: 'Templates' },
  { to: '/about', label: 'About' },
];

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { resolved, cycle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-6 px-4 sm:px-6">
        <NavLink to="/" className="no-underline" aria-label="EWM Mastery home">
          <Logo />
        </NavLink>
        <nav aria-label="Primary" className="hidden items-center gap-5 text-[13.5px] font-semibold lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `py-[17px] no-underline transition-colors hover:text-primary ${
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-text2'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden items-center gap-2.5 rounded-control border border-border-strong bg-surface px-3 py-[7px] text-[13px] text-text3 transition-colors hover:border-primary sm:flex"
        >
          <span className="hidden md:inline">Search incidents &amp; Q&amp;A…</span>
          <span className="md:hidden">Search…</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-border-strong bg-surface text-text transition-colors hover:border-primary sm:hidden"
        >
          ⌕
        </button>
        <button
          type="button"
          onClick={cycle}
          aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-control border border-border-strong bg-surface text-[15px] text-text transition-colors hover:border-primary"
        >
          {resolved === 'dark' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  );
}
