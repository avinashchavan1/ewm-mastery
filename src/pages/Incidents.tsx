import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import type { Incident, Priority } from '../types';
import { GROUP_ORDER, GROUP_SLUG, SLUG_TO_GROUP, groupFor, type Group } from '../data/groups';
import { filterIncidents } from '../lib/filterIncidents';
import { PriorityBadge } from '../components/primitives';
import { useSeo } from '../lib/seo';
import { incidentPath } from '../lib/site';

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const PRI_CHIP: Record<Priority, string> = {
  Critical: 'bg-crit-bg text-crit-text border-crit-text',
  High: 'bg-high-bg text-high-text border-high-text',
  Medium: 'bg-med-bg text-med-text border-med-text',
  Low: 'bg-low-bg text-low-text border-low-text',
};

export default function Incidents() {
  const { incidents } = useData();
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useSeo({
    title: 'SAP EWM Support Incidents — 26 Runbooks',
    description:
      'Browse 26 real SAP EWM support incidents by process area, priority and t-code. Each is a full runbook: symptom, system analysis, root cause, resolution and prevention.',
    path: '/incidents',
  });

  const group = params.get('group') ? SLUG_TO_GROUP[params.get('group')!] ?? null : null;
  const area = params.get('area');
  const priParam = params.get('pri') ?? '';
  const pris = useMemo(() => priParam.split(',').filter(Boolean) as Priority[], [priParam]);
  const q = params.get('q') ?? '';

  const update = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params);
    mut(p);
    setParams(p, { replace: true });
  };

  const setGroup = (g: Group | null) =>
    update((p) => {
      if (g === null || group === g) {
        p.delete('group');
        p.delete('area');
      } else {
        p.set('group', GROUP_SLUG[g]);
        p.delete('area');
      }
    });
  const setArea = (a: string | null) =>
    update((p) => {
      if (a && area !== a) p.set('area', a);
      else p.delete('area');
    });
  const togglePri = (pr: Priority) =>
    update((p) => {
      const next = pris.includes(pr) ? pris.filter((x) => x !== pr) : [...pris, pr];
      if (next.length) p.set('pri', next.join(','));
      else p.delete('pri');
    });
  const setQ = (v: string) =>
    update((p) => {
      if (v) p.set('q', v);
      else p.delete('q');
    });
  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const groupCounts = useMemo(() => {
    const m = new Map<Group, number>();
    for (const g of GROUP_ORDER) m.set(g, 0);
    for (const i of incidents) {
      const g = groupFor(i.processArea);
      if (g) m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  }, [incidents]);

  const childAreas = useMemo(() => {
    if (!group) return [];
    const set = new Map<string, number>();
    for (const i of incidents) {
      if (groupFor(i.processArea) === group) set.set(i.processArea, (set.get(i.processArea) ?? 0) + 1);
    }
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [incidents, group]);

  const results = useMemo(
    () => filterIncidents(incidents, { group, area, pris, q }),
    [incidents, group, area, pris, q],
  );

  const chips: { label: string; remove: () => void }[] = [];
  if (group) chips.push({ label: group, remove: () => setGroup(null) });
  if (area) chips.push({ label: area, remove: () => setArea(null) });
  for (const p of pris) chips.push({ label: p, remove: () => togglePri(p) });
  if (q.trim()) chips.push({ label: `“${q.trim()}”`, remove: () => setQ('') });

  const filters = (
    <>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text2">
          Process area
        </div>
        <div className="flex flex-col gap-0.5">
          {GROUP_ORDER.map((g) => {
            const on = group === g;
            return (
              <div key={g}>
                <button
                  type="button"
                  onClick={() => setGroup(g)}
                  aria-expanded={on}
                  className={`flex w-full items-center gap-2 rounded-control px-2.5 py-[7px] text-left text-[13.5px] font-semibold transition-colors hover:bg-surface2 ${
                    on ? 'bg-primary-tint text-primary' : 'text-text2'
                  }`}
                >
                  <span className="flex-1">{g}</span>
                  <span className="text-xs font-semibold text-text3">{groupCounts.get(g)}</span>
                </button>
                {on && childAreas.length > 1 && (
                  <div className="ml-2.5 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                    {childAreas.map(([a, n]) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setArea(a)}
                        className={`flex items-center gap-2 rounded-control px-2 py-1 text-left text-[12.5px] transition-colors hover:bg-surface2 ${
                          area === a ? 'font-semibold text-primary' : 'text-text2'
                        }`}
                      >
                        <span className="flex-1">{a}</span>
                        <span className="text-text3">{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text2">Priority</div>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => {
            const on = pris.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePri(p)}
                aria-pressed={on}
                className={`rounded-full border px-[11px] py-[3px] text-xs font-bold transition-opacity ${
                  on ? PRI_CHIP[p] : 'border-border-strong text-text2'
                }`}
              >
                {p} {on && '✓'}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="mx-auto flex max-w-shell items-start gap-7 px-4 py-7 pb-24 sm:px-6 lg:pb-16">
      <aside
        aria-label="Filters"
        className="sticky top-20 hidden w-[236px] flex-none flex-col gap-5 lg:flex"
      >
        {filters}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter incidents"
            placeholder="Filter results — title, symptom, t-code… (full corpus: ⌘K)"
            className="flex-1 rounded-control border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:outline-2 focus:outline-primary"
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex-none rounded-control border border-border-strong bg-surface px-3 text-[13px] font-semibold text-text lg:hidden"
          >
            Filters{chips.length ? ` (${chips.length})` : ''}
          </button>
        </div>

        <div className="flex min-h-[24px] flex-wrap items-center gap-2" aria-live="polite">
          {chips.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={c.remove}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              {c.label} ✕
            </button>
          ))}
          {chips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-1.5 py-0.5 text-[12.5px] font-semibold text-link hover:underline"
            >
              Clear all
            </button>
          )}
          <span className="flex-1" />
          <span className="text-[12.5px] text-text2">{results.length} of {incidents.length} incidents</span>
        </div>

        {results.length > 0 ? (
          <div className="flex flex-col gap-2">
            {results.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border-strong bg-surface p-8 text-center">
            <div className="text-[15px] font-semibold">
              Nothing matches {chips.map((c) => c.label).join(' + ') || 'these filters'}.
            </div>
            <div className="mb-3.5 mt-1.5 text-[13.5px] text-text2">
              Remove a filter, or search the full corpus with ⌘K.
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-control border border-border-strong bg-surface px-[18px] py-2.5 text-[13.5px] font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-border-strong bg-surface p-5 shadow-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border-strong" />
            <div className="mb-3 flex items-center">
              <div className="text-[15px] font-bold">Filters</div>
              <span className="flex-1" />
              {chips.length > 0 && (
                <button type="button" onClick={clearAll} className="text-[13px] font-semibold text-link">
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col gap-5">{filters}</div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-5 w-full rounded-control bg-primary py-3 text-sm font-semibold text-on-primary"
            >
              Show {results.length} result{results.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident: i }: { incident: Incident }) {
  return (
    <Link
      to={incidentPath(i.id)}
      className="block rounded-card border border-border bg-surface px-[18px] py-3.5 no-underline text-text transition-all hover:border-primary hover:shadow-card"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-xs text-text2">{i.id}</span>
        <PriorityBadge priority={i.priority} />
        <span className="text-[12.5px] text-text2">
          {groupFor(i.processArea)} · {i.processArea}
        </span>
      </div>
      <div className="mb-1.5 text-[15px] font-semibold leading-5">{i.title}</div>
      <div className="flex flex-wrap gap-1.5">
        {i.tcodes.map((t) => (
          <span
            key={t}
            className="rounded-[5px] border border-border bg-surface2 px-2 py-0.5 font-mono text-[11.5px] font-medium text-text2"
          >
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
