import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { useSeo } from '../lib/seo';
import type { Question } from '../types';

type Phase = 'build' | 'session' | 'summary';
interface Card extends Question {
  day: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseDays(param: string | null): number[] {
  if (!param) return [];
  const out = new Set<number>();
  for (const part of param.split(',')) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      for (let n = a; n <= b; n++) out.add(n);
    } else if (part.trim()) out.add(Number(part));
  }
  return [...out];
}

export default function Flashcards() {
  const { days } = useData();
  const { isReviewed, registerActivity } = useProgress();
  const [params] = useSearchParams();

  useSeo({
    title: 'SAP EWM Flashcards',
    description:
      'Build a custom SAP EWM flashcard deck from any of the 21 study days. Flip, self-grade, and requeue the ones you miss. Free and offline.',
    path: '/flashcards',
  });

  const [phase, setPhase] = useState<Phase>('build');
  const [selected, setSelected] = useState<Set<number>>(() => new Set(parseDays(params.get('days'))));
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [doShuffle, setDoShuffle] = useState(true);

  const cardMap = useMemo(() => {
    const m = new Map<string, Card>();
    for (const d of days) for (const q of d.questions) m.set(q.id, { ...q, day: d.day });
    return m;
  }, [days]);

  const buildPool = useCallback(
    (missedIds?: string[]): Card[] => {
      let pool: Card[];
      if (missedIds) {
        pool = missedIds.map((id) => cardMap.get(id)).filter((c): c is Card => !!c);
      } else {
        pool = days
          .filter((d) => selected.has(d.day))
          .flatMap((d) => d.questions.map((q) => ({ ...q, day: d.day })));
        if (unreviewedOnly) pool = pool.filter((c) => !isReviewed(c.id));
      }
      return doShuffle ? shuffle(pool) : pool;
    },
    [days, selected, unreviewedOnly, doShuffle, isReviewed, cardMap],
  );

  // Session state.
  const [queue, setQueue] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const gotSet = useRef<Set<string>>(new Set());
  const requeued = useRef<Set<string>>(new Set());
  const started = useRef<number>(0);
  const baseTotal = useRef<number>(0);

  const start = (missedIds?: string[]) => {
    const pool = buildPool(missedIds);
    if (pool.length === 0) return;
    gotSet.current = new Set();
    requeued.current = new Set();
    started.current = Date.now();
    baseTotal.current = pool.length;
    setQueue(pool.map((c) => c.id));
    setPos(0);
    setFlipped(false);
    setPhase('session');
    registerActivity();
  };

  const current = phase === 'session' ? cardMap.get(queue[pos]) : undefined;

  const grade = useCallback(
    (got: boolean) => {
      const id = queue[pos];
      if (!id) return;
      if (got) {
        gotSet.current.add(id);
        setQueue((qu) => qu);
        setPos((p) => p + 1);
      } else {
        requeued.current.add(id);
        setQueue((qu) => [...qu, id]);
        setPos((p) => p + 1);
      }
      setFlipped(false);
    },
    [pos, queue],
  );

  // End of queue → summary.
  useEffect(() => {
    if (phase === 'session' && pos >= queue.length && queue.length > 0) setPhase('summary');
  }, [phase, pos, queue.length]);

  // Keys: Space flip · 1 review again · 2 got it · ←/→ nav (spec §5).
  useEffect(() => {
    if (phase !== 'session') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === '1' && flipped) grade(false);
      else if (e.key === '2' && flipped) grade(true);
      else if (e.key === 'ArrowLeft') {
        setPos((p) => Math.max(0, p - 1));
        setFlipped(false);
      } else if (e.key === 'ArrowRight' && flipped) grade(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, flipped, grade]);

  const allDays = days.map((d) => d.day);
  const allSelected = selected.size === days.length;
  const poolSize = useMemo(() => buildPool().length, [buildPool]);

  // ── Build phase ──
  if (phase === 'build') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 lg:pb-16">
        <h1 className="text-[28px] font-bold leading-8 tracking-tight">Flashcards</h1>
        <p className="mt-1 text-sm text-text2">
          Pick days, flip to grade yourself. Missed cards come back before the deck ends.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text2">Days</div>
          <button
            type="button"
            onClick={() => setSelected(allSelected ? new Set() : new Set(allDays))}
            className="text-[13px] font-semibold text-link hover:underline"
          >
            {allSelected ? 'Clear all' : 'Select all 21'}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {days.map((d) => {
            const on = selected.has(d.day);
            return (
              <button
                key={d.day}
                type="button"
                onClick={() =>
                  setSelected((s) => {
                    const n = new Set(s);
                    if (n.has(d.day)) n.delete(d.day);
                    else n.add(d.day);
                    return n;
                  })
                }
                aria-pressed={on}
                className={`rounded-card border p-3 text-left transition-colors ${
                  on ? 'border-primary bg-primary-tint' : 'border-border bg-surface hover:border-primary'
                }`}
              >
                <div className="font-mono text-[11px] text-text2">Day {d.day}</div>
                <div className="truncate text-[13px] font-semibold">{d.title}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Toggle checked={unreviewedOnly} onChange={setUnreviewedOnly}>
            Only not-yet-reviewed questions
          </Toggle>
          <Toggle checked={doShuffle} onChange={setDoShuffle}>
            Shuffle the deck
          </Toggle>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={poolSize === 0}
            onClick={() => start()}
            className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-text3"
          >
            Start deck ({poolSize})
          </button>
          {selected.size === 0 && <span className="text-[13px] text-text2">Pick at least one day to build a deck.</span>}
          {selected.size > 0 && unreviewedOnly && poolSize === 0 && (
            <span className="text-[13px] text-text2">
              You’ve reviewed everything in the selected days. Uncheck “Unreviewed only” to drill them anyway.
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Summary phase ──
  if (phase === 'summary') {
    const total = baseTotal.current;
    const requeuedCount = requeued.current.size;
    const firstTry = total - requeuedCount;
    const mins = Math.max(1, Math.round((Date.now() - started.current) / 60000));
    const missedIds = [...requeued.current];
    return (
      <div className="mx-auto max-w-xl px-4 py-12 pb-24 text-center sm:px-6 lg:pb-16">
        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text2">Session summary</div>
        <div className="mt-2 text-[40px] font-bold leading-none">
          {firstTry} / {total}
        </div>
        <div className="mt-1 text-[15px] text-text2">first try</div>
        <div className="mt-2 text-[13.5px] text-text2">
          {requeuedCount} requeued · all cleared · {mins} min
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {missedIds.length > 0 && (
            <button
              type="button"
              onClick={() => start(missedIds)}
              className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-strong"
            >
              Restart with {missedIds.length} missed only
            </button>
          )}
          <button
            type="button"
            onClick={() => setPhase('build')}
            className="rounded-control border border-border-strong bg-surface px-6 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            New deck
          </button>
        </div>
      </div>
    );
  }

  // ── Session phase ──
  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-8 pb-24 sm:px-6 lg:pb-16">
      <div className="flex items-center gap-3 text-[13px]">
        <button
          type="button"
          onClick={() => setPhase('build')}
          className="font-semibold no-underline hover:text-primary"
        >
          ← Deck builder
        </button>
        <span className="flex-1" />
        <span aria-live="polite" className="text-text2">
          Card {Math.min(pos + 1, queue.length)} of {queue.length}
          {requeued.current.size > 0 && ` · ${requeued.current.size} requeued`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-live="polite"
        className="mt-4 flex min-h-[280px] w-full flex-col rounded-card border border-border bg-surface p-7 text-left transition-colors hover:border-primary"
      >
        <div className="flex items-center gap-2 text-[11.5px] text-text2">
          <span className="font-mono">
            Day {current?.day} · {current?.id}
          </span>
          <span className="flex-1" />
          <span>{flipped ? 'Answer' : 'Question'}</span>
        </div>
        <div className="flex flex-1 items-center">
          <p className={`${flipped ? 'text-[15px] leading-6 text-text' : 'text-xl font-semibold leading-7'}`}>
            {flipped ? current?.answer : current?.question}
          </p>
        </div>
        {!flipped && (
          <div className="text-center text-[12.5px] text-text3">Click or press Space to show answer</div>
        )}
      </button>

      {flipped ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => grade(false)}
            className="flex-1 rounded-control border border-high-text bg-high-bg py-3 text-sm font-semibold text-high-text"
          >
            Review again <kbd>1</kbd>
          </button>
          <button
            type="button"
            onClick={() => grade(true)}
            className="flex-1 rounded-control border border-ok bg-ok-bg py-3 text-sm font-semibold text-ok"
          >
            Got it <kbd>2</kbd>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="mt-4 rounded-control bg-primary py-3 text-sm font-semibold text-on-primary hover:bg-primary-strong"
        >
          Show answer <kbd>Space</kbd>
        </button>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--c-primary)]"
      />
      <span>{children}</span>
    </label>
  );
}
