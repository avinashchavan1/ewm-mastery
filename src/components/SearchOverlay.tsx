import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { nearestIncidentTitle, useSearchIndex, type Hit } from '../lib/searchIndex';
import { useProgress } from '../lib/progress';
import { highlight } from '../lib/highlight';
import { PriorityBadge } from './primitives';
import { incidentPath } from '../lib/site';

interface Flat {
  hit: Hit;
  href: string;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { incidents } = useData();
  const { search } = useSearchIndex();
  const { recent } = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  const invoker = useRef<Element | null>(null);
  const [raw, setRaw] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // Debounce input → query (spec: global, debounced).
  useEffect(() => {
    const id = window.setTimeout(() => setQuery(raw), 130);
    return () => window.clearTimeout(id);
  }, [raw]);

  useEffect(() => {
    if (open) {
      invoker.current = document.activeElement;
      setRaw('');
      setQuery('');
      setActive(0);
      // Focus after mount.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => search(query, 40), [search, query]);

  const flat = useMemo<Flat[]>(() => {
    const arr: Flat[] = [];
    for (const hit of results.incidents) {
      arr.push({ hit, href: incidentPath(hit.doc.id) });
    }
    for (const hit of results.qa) {
      if (hit.doc.kind !== 'qa') continue;
      arr.push({ hit, href: `/prep/day/${hit.doc.day}?q=${hit.doc.id}` });
    }
    return arr;
  }, [results]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const close = () => {
    onClose();
    (invoker.current as HTMLElement | null)?.focus?.();
  };

  const go = (href: string) => {
    close();
    navigate(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault();
      go(flat[active].href);
    }
  };

  const hasQuery = query.trim().length > 0;
  const noHits = hasQuery && flat.length === 0;
  const nearest = noHits ? nearestIncidentTitle(incidents, query) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[8vh]"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-border-strong bg-surface shadow-overlay"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span aria-hidden className="text-text3">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="search-listbox"
            aria-activedescendant={flat[active] ? `search-opt-${active}` : undefined}
            placeholder="Search 26 incidents and 630 questions…"
            className="flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text3"
          />
          <button
            type="button"
            onClick={close}
            className="rounded border border-border px-2 py-0.5 text-xs font-semibold text-text2 hover:border-primary"
          >
            Esc
          </button>
        </div>

        <div className="overflow-y-auto" id="search-listbox" role="listbox">
          {!hasQuery && (
            <div className="p-4">
              <p className="text-[13.5px] text-text2">
                Search 26 incidents and 630 questions. Try:{' '}
                <span className="font-mono text-[12.5px]">/SCWM/MON</span> ·{' '}
                <span className="font-mono text-[12.5px]">wave</span> ·{' '}
                <span className="font-mono text-[12.5px]">putaway</span>
              </p>
              {recent.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text2">
                    Recently viewed
                  </div>
                  <div className="flex flex-col gap-1">
                    {recent.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        type="button"
                        onClick={() =>
                          go(r.type === 'incident' ? incidentPath(r.id) : `/prep/day/${r.id}`)
                        }
                        className="rounded-control px-2 py-1.5 text-left text-sm hover:bg-surface2"
                      >
                        <span className="font-mono text-[12px] text-text2">
                          {r.type === 'incident' ? r.id : `Day ${r.id}`}
                        </span>{' '}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {noHits && (
            <div className="p-6 text-center">
              <div className="text-[15px] font-semibold">No exact matches for “{query.trim()}”.</div>
              {nearest && (
                <div className="mt-1 text-[13.5px] text-text2">Closest: {nearest}</div>
              )}
              <div className="mt-1 text-[13.5px] text-text2">Tip: try a single word or a t-code.</div>
            </div>
          )}

          {hasQuery && flat.length > 0 && (
            <>
              <div aria-live="polite" className="sr-only">
                {flat.length} results
              </div>
              {results.incidents.length > 0 && (
                <GroupLabel>Incidents ({results.incidents.length})</GroupLabel>
              )}
              {flat.map((f, i) => {
                if (f.hit.doc.kind !== 'incident') return null;
                return (
                  <ResultRow
                    key={`i-${f.hit.doc.id}`}
                    id={`search-opt-${i}`}
                    active={i === active}
                    onClick={() => go(f.href)}
                    onHover={() => setActive(i)}
                  >
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11.5px] text-text2">{f.hit.doc.id}</span>
                      <PriorityBadge priority={f.hit.doc.incident.priority} />
                    </div>
                    <div className="text-[14px] font-semibold leading-5">
                      {highlight(f.hit.doc.title, query)}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-text2">{highlight(f.hit.snippet, query)}</div>
                  </ResultRow>
                );
              })}

              {results.qa.length > 0 && <GroupLabel>Interview Q&amp;A ({results.qa.length})</GroupLabel>}
              {flat.map((f, i) => {
                if (f.hit.doc.kind !== 'qa') return null;
                return (
                  <ResultRow
                    key={`q-${f.hit.doc.id}`}
                    id={`search-opt-${i}`}
                    active={i === active}
                    onClick={() => go(f.href)}
                    onHover={() => setActive(i)}
                  >
                    <div className="mb-0.5 font-mono text-[11.5px] text-text2">
                      Day {f.hit.doc.day} · {f.hit.doc.id}
                    </div>
                    <div className="text-[14px] font-semibold leading-5">
                      {highlight(f.hit.doc.question, query)}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-text2">{highlight(f.hit.snippet, query)}</div>
                  </ResultRow>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 bg-surface2 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-text2">
      {children}
    </div>
  );
}

function ResultRow({
  id,
  active,
  onClick,
  onHover,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseMove={onHover}
      className={`cursor-pointer border-b border-border px-4 py-2.5 ${active ? 'bg-surface2' : ''}`}
    >
      {children}
    </div>
  );
}
