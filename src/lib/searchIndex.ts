import { useMemo } from 'react';
import { useData } from '../data/DataContext';
import type { DayQA, Incident } from '../types';
import { groupFor } from '../data/groups';

// Search corpus — ux/03: 26 incidents + 630 Q&A. Ranking:
// title/question match > t-code exact > body match.

export interface IncidentDoc {
  kind: 'incident';
  id: string;
  incident: Incident;
  title: string;
  tcodes: string[];
  haystack: string; // lowercased body
}

export interface QADoc {
  kind: 'qa';
  id: string;
  day: number;
  dayTitle: string;
  question: string;
  answer: string;
  haystack: string;
}

export type Doc = IncidentDoc | QADoc;

export interface Hit {
  doc: Doc;
  score: number;
  snippet: string;
}

function buildIncidentDocs(incidents: Incident[]): IncidentDoc[] {
  return incidents.map((i) => ({
    kind: 'incident',
    id: i.id,
    incident: i,
    title: i.title,
    tcodes: i.tcodes,
    haystack: [
      i.title,
      i.description,
      i.rootCause,
      i.prevention,
      i.systemAnalysis.join(' '),
      i.resolution.join(' '),
      i.tcodes.join(' '),
      i.processArea,
      i.id,
    ]
      .join(' ')
      .toLowerCase(),
  }));
}

function buildQADocs(days: DayQA[]): QADoc[] {
  const docs: QADoc[] = [];
  for (const d of days) {
    for (const q of d.questions) {
      docs.push({
        kind: 'qa',
        id: q.id,
        day: d.day,
        dayTitle: d.title,
        question: q.question,
        answer: q.answer,
        haystack: `${q.question} ${q.answer} ${d.title} ${q.id}`.toLowerCase(),
      });
    }
  }
  return docs;
}

function makeSnippet(body: string, term: string, len = 120): string {
  const idx = body.toLowerCase().indexOf(term);
  if (idx < 0) return body.slice(0, len) + (body.length > len ? '…' : '');
  const start = Math.max(0, idx - 40);
  const end = Math.min(body.length, idx + term.length + 80);
  return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
}

export interface SearchIndex {
  docs: Doc[];
  search: (query: string, limit?: number) => { incidents: Hit[]; qa: Hit[] };
}

export function useSearchIndex(): SearchIndex {
  const { incidents, days } = useData();

  return useMemo<SearchIndex>(() => {
    const incidentDocs = buildIncidentDocs(incidents);
    const qaDocs = buildQADocs(days);
    const docs: Doc[] = [...incidentDocs, ...qaDocs];

    function scoreDoc(doc: Doc, term: string): number {
      if (!doc.haystack.includes(term)) return 0;
      let score = 1; // body match baseline
      if (doc.kind === 'incident') {
        if (doc.title.toLowerCase().includes(term)) score += 8;
        if (doc.tcodes.some((t) => t.toLowerCase() === term)) score += 6;
        if (doc.tcodes.some((t) => t.toLowerCase().includes(term))) score += 3;
        if (doc.id.toLowerCase().includes(term)) score += 4;
      } else {
        if (doc.question.toLowerCase().includes(term)) score += 8;
        if (doc.dayTitle.toLowerCase().includes(term)) score += 3;
        if (doc.id.toLowerCase().includes(term)) score += 4;
      }
      return score;
    }

    function search(query: string, limit = 50) {
      const term = query.trim().toLowerCase();
      if (!term) return { incidents: [], qa: [] };
      const incidentHits: Hit[] = [];
      const qaHits: Hit[] = [];
      for (const doc of docs) {
        const score = scoreDoc(doc, term);
        if (score === 0) continue;
        if (doc.kind === 'incident') {
          incidentHits.push({
            doc,
            score,
            snippet: makeSnippet(doc.incident.description, term),
          });
        } else {
          const src = doc.question.toLowerCase().includes(term) ? doc.question : doc.answer;
          qaHits.push({ doc, score, snippet: makeSnippet(src, term) });
        }
      }
      incidentHits.sort((a, b) => b.score - a.score);
      qaHits.sort((a, b) => b.score - a.score);
      return { incidents: incidentHits.slice(0, limit), qa: qaHits.slice(0, limit) };
    }

    return { docs, search };
  }, [incidents, days]);
}

// Nearest-title fallback for the "no exact match" empty state (spec §1).
export function nearestIncidentTitle(incidents: Incident[], query: string): string | null {
  const t = query.trim().toLowerCase();
  if (!t || incidents.length === 0) return null;
  const words = t.split(/\s+/);
  let best: { title: string; n: number } | null = null;
  for (const i of incidents) {
    const hay = `${i.title} ${i.processArea} ${i.tcodes.join(' ')}`.toLowerCase();
    const n = words.reduce((c, w) => c + (hay.includes(w) ? 1 : 0), 0);
    if (n > 0 && (!best || n > best.n)) best = { title: `${i.id} — ${i.title}`, n };
  }
  return best?.title ?? null;
}

export { groupFor };
