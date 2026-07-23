import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

// Mobile bottom tab bar (ux/03: 5 slots, thumb reach). Study/More open a sheet.
const tabs = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/incidents', label: 'Incidents', icon: '🎫' },
  { to: '/prep', label: 'Prep', icon: '📅' },
];

function Sheet({
  title,
  items,
  onClose,
}: {
  title: string;
  items: { to: string; label: string; desc: string }[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl border-t border-border-strong bg-surface p-4 shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border-strong" />
        <div className="mb-2 text-[15px] font-bold">{title}</div>
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <button
              key={it.to}
              type="button"
              onClick={() => {
                navigate(it.to);
                onClose();
              }}
              className="rounded-card border border-border bg-surface p-3 text-left transition-colors hover:border-primary"
            >
              <div className="text-[15px] font-semibold">{it.label}</div>
              <div className="text-[13px] text-text2">{it.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BottomTabs() {
  const [sheet, setSheet] = useState<null | 'study' | 'more'>(null);
  const { pathname } = useLocation();
  const studyActive = pathname.startsWith('/flashcards') || pathname.startsWith('/quiz');
  const moreActive = pathname.startsWith('/templates') || pathname.startsWith('/about');

  const cls = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
      active ? 'text-primary' : 'text-text2'
    }`;

  return (
    <>
      {sheet === 'study' && (
        <Sheet
          title="Study"
          onClose={() => setSheet(null)}
          items={[
            { to: '/flashcards', label: 'Flashcards', desc: 'Build a deck, flip, self-grade' },
            { to: '/quiz', label: 'Quiz', desc: '10 questions, reveal & score' },
          ]}
        />
      )}
      {sheet === 'more' && (
        <Sheet
          title="More"
          onClose={() => setSheet(null)}
          items={[
            { to: '/templates', label: 'Templates', desc: '3 governance xlsx downloads' },
            { to: '/about', label: 'About', desc: 'Credits, shortcuts, disclaimer' },
          ]}
        />
      )}
      <nav
        aria-label="Sections"
        className="sticky bottom-0 z-30 flex border-t border-border bg-surface lg:hidden"
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => cls(isActive)}
          >
            <span aria-hidden className="text-base leading-none">
              {t.icon}
            </span>
            {t.label}
          </NavLink>
        ))}
        <button type="button" className={cls(studyActive)} onClick={() => setSheet('study')} aria-haspopup="dialog">
          <span aria-hidden className="text-base leading-none">
            🎴
          </span>
          Study
        </button>
        <button type="button" className={cls(moreActive)} onClick={() => setSheet('more')} aria-haspopup="dialog">
          <span aria-hidden className="text-base leading-none">
            ⋯
          </span>
          More
        </button>
      </nav>
    </>
  );
}
