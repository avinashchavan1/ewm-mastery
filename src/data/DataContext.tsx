import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DayQA, Incident, Meta } from '../types';

interface DataState {
  status: 'loading' | 'ready' | 'error';
  meta: Meta | null;
  incidents: Incident[];
  days: DayQA[];
  error: string | null;
}

const DataContext = createContext<DataState | null>(null);

// base:'./' → assets resolve relative to the deployed path.
const base = import.meta.env.BASE_URL || '/';
const url = (p: string) => `${base}content/${p}`.replace(/\/{2,}/g, '/').replace(':/', '://');

async function fetchJSON<T>(file: string): Promise<T> {
  const res = await fetch(url(file));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

// Dev-only contract validation — warn on mismatch, never crash the app.
function validate(meta: Meta, incidents: Incident[], days: DayQA[]) {
  if (!import.meta.env.DEV) return;
  const warn = (m: string) => console.warn(`[EWM data contract] ${m}`);
  if (incidents.length !== meta.incidents)
    warn(`incidents.json has ${incidents.length}, meta says ${meta.incidents}`);
  if (days.length !== meta.days) warn(`qa.json has ${days.length} days, meta says ${meta.days}`);
  const totalQ = days.reduce((n, d) => n + d.questions.length, 0);
  if (totalQ !== meta.totalQuestions)
    warn(`qa.json has ${totalQ} questions, meta says ${meta.totalQuestions}`);
  for (const d of days) {
    if (d.questions.length !== d.questionCount)
      warn(`Day ${d.day}: ${d.questions.length} questions but questionCount=${d.questionCount}`);
  }
  const incidentKeys: (keyof Incident)[] = [
    'id', 'number', 'title', 'priority', 'processArea', 'tcodes',
    'description', 'systemAnalysis', 'rootCause', 'resolution', 'prevention',
  ];
  incidents.forEach((i) => {
    for (const k of incidentKeys) if (!(k in i)) warn(`${i.id ?? '?'} missing field "${k}"`);
  });
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    status: 'loading',
    meta: null,
    incidents: [],
    days: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchJSON<Meta>('meta.json'),
      fetchJSON<Incident[]>('incidents.json'),
      fetchJSON<DayQA[]>('qa.json'),
    ])
      .then(([meta, incidents, days]) => {
        if (cancelled) return;
        validate(meta, incidents, days);
        days.sort((a, b) => a.day - b.day);
        setState({ status: 'ready', meta, incidents, days, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error',
        }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// Convenience hooks (memoized lookups).
export function useIncident(id: string | undefined) {
  const { incidents } = useData();
  return useMemo(() => incidents.find((i) => i.id === id), [incidents, id]);
}

export function useDay(day: number) {
  const { days } = useData();
  return useMemo(() => days.find((d) => d.day === day), [days, day]);
}
