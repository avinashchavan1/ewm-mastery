import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { useToast } from '../lib/toast';
import { groupFor, PRIORITY_ORDER } from '../data/groups';
import { PriorityBadge, TcodeChip } from '../components/primitives';
import { useSeo, breadcrumb } from '../lib/seo';
import { AUTHOR, incidentPath } from '../lib/site';
import type { Incident } from '../types';

function incidentToText(i: Incident): string {
  return [
    `${i.id} — ${i.title}`,
    `Priority: ${i.priority}   Area: ${groupFor(i.processArea)} · ${i.processArea}`,
    `T-codes: ${i.tcodes.join(', ')}`,
    '',
    'INCIDENT DESCRIPTION (AS REPORTED)',
    i.description,
    '',
    'SYSTEM ANALYSIS',
    ...i.systemAnalysis.map((s, n) => `${n + 1}. ${s}`),
    '',
    'ROOT CAUSE',
    i.rootCause,
    '',
    'RESOLUTION',
    ...i.resolution.map((s, n) => `${n + 1}. ${s}`),
    '',
    'PREVENTIVE ACTION / LESSON LEARNED',
    i.prevention,
  ].join('\n');
}

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incidents } = useData();
  const { isReviewed, toggleReviewed, pushRecent } = useProgress();
  const toast = useToast();

  const ordered = useMemo(
    () =>
      [...incidents].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.id.localeCompare(b.id),
      ),
    [incidents],
  );
  const idx = ordered.findIndex((i) => i.id.toLowerCase() === (id ?? '').toLowerCase());
  const incident = ordered[idx];
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  useEffect(() => {
    if (incident) pushRecent({ type: 'incident', id: incident.id, label: incident.title });
  }, [incident, pushRecent]);

  // Keyboard [ / ] → prev/next incident (spec §5).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '[' && prev) navigate(incidentPath(prev.id));
      if (e.key === ']' && next) navigate(incidentPath(next.id));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, navigate]);

  useSeo(
    incident
      ? {
          title: `${incident.id}: ${incident.title}`,
          description: `SAP EWM ${incident.priority}-priority incident runbook (${incident.processArea}). ${incident.description}`.slice(
            0,
            300,
          ),
          path: incidentPath(incident.id),
          type: 'article',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'TechArticle',
              headline: `${incident.id}: ${incident.title}`,
              about: `SAP EWM ${incident.processArea}`,
              articleSection: incident.processArea,
              keywords: incident.tcodes.join(', '),
              author: { '@type': 'Person', name: AUTHOR },
              description: incident.description,
              proficiencyLevel: 'Expert',
            },
            breadcrumb([
              { name: 'Home', path: '/' },
              { name: 'Incidents', path: '/incidents' },
              { name: incident.id, path: incidentPath(incident.id) },
            ]),
          ],
        }
      : { title: 'Incident not found', description: 'Incident not found.', path: '/incidents', noindex: true },
  );

  if (!incident) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Incident not found</h1>
        <Link to="/incidents" className="mt-3 inline-block font-semibold">
          ← Back to all incidents
        </Link>
      </div>
    );
  }

  const read = isReviewed(incident.id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(incidentToText(incident));
      toast('Incident copied as text');
    } catch {
      toast('Copy blocked by browser');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 pb-24 sm:px-6 lg:pb-16">
      <div className="mb-4 flex items-center gap-3 text-[13px]">
        <Link to="/incidents" className="font-semibold no-underline hover:text-primary">
          ← All incidents
        </Link>
        <span className="text-text3">
          {idx + 1} / {ordered.length}
        </span>
        <span className="flex-1" />
        <span className="hidden text-text3 sm:inline">
          <kbd>[</kbd> prev · <kbd>]</kbd> next
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[13px] text-text2">{incident.id}</span>
        <PriorityBadge priority={incident.priority} />
        <span className="text-[13px] text-text2">
          {groupFor(incident.processArea)} · {incident.processArea}
        </span>
      </div>
      <h1 className="text-[28px] font-bold leading-8 tracking-tight">{incident.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {incident.tcodes.map((t) => (
          <TcodeChip key={t} code={t} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleReviewed(incident.id)}
          aria-pressed={read}
          className={`rounded-control border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
            read
              ? 'border-ok bg-ok-bg text-ok'
              : 'border-border-strong bg-surface text-text hover:border-primary hover:text-primary'
          }`}
        >
          {read ? '✓ Marked as read' : 'Mark as read'}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-control border border-border-strong bg-surface px-4 py-2 text-[13.5px] font-semibold transition-colors hover:border-primary hover:text-primary"
        >
          Copy as text
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-7">
        <Section title="Incident Description (as reported)">
          <p className="text-[15px] leading-6 text-text">{incident.description}</p>
        </Section>
        <Section title="System Analysis">
          <ul className="flex flex-col gap-2">
            {incident.systemAnalysis.map((s, n) => (
              <li key={n} className="flex gap-3 text-[15px] leading-6">
                <span className="font-mono text-[13px] text-text3">{n + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Root Cause">
          <p className="text-[15px] leading-6 text-text">{incident.rootCause}</p>
        </Section>
        <Section title="Resolution">
          <ol className="flex flex-col gap-2">
            {incident.resolution.map((s, n) => (
              <li key={n} className="flex gap-3 text-[15px] leading-6">
                <span className="font-mono text-[13px] text-text3">{n + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>
        <Section title="Preventive Action / Lesson Learned">
          <p className="text-[15px] leading-6 text-text">{incident.prevention}</p>
        </Section>
      </div>

      <nav className="mt-10 flex items-stretch gap-3 border-t border-border pt-6" aria-label="Incident pagination">
        {prev ? (
          <Link
            to={incidentPath(prev.id)}
            className="flex-1 rounded-card border border-border bg-surface p-4 no-underline text-text transition-colors hover:border-primary"
          >
            <div className="text-xs text-text2">← {prev.id}</div>
            <div className="mt-0.5 text-sm font-semibold leading-5">{prev.title}</div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            to={incidentPath(next.id)}
            className="flex-1 rounded-card border border-border bg-surface p-4 text-right no-underline text-text transition-colors hover:border-primary"
          >
            <div className="text-xs text-text2">{next.id} →</div>
            <div className="mt-0.5 text-sm font-semibold leading-5">{next.title}</div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
