import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { useSeo } from '../lib/seo';
import type { Question } from '../types';

type Phase = 'build' | 'quiz' | 'score';
interface QItem extends Question {
  day: number;
}

const QUIZ_SIZE = 10;

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

export default function Quiz() {
  const { days } = useData();
  const { addQuizResult } = useProgress();
  const [params] = useSearchParams();

  useSeo({
    title: 'SAP EWM Quiz',
    description:
      'Test your SAP EWM knowledge with a 10-question quiz drawn from any of the 21 study days. Reveal answers, self-score, and retake the ones you miss.',
    path: '/quiz',
  });

  const [phase, setPhase] = useState<Phase>('build');
  const [selected, setSelected] = useState<Set<number>>(() => {
    const pre = parseDays(params.get('days'));
    return pre.length ? new Set(pre) : new Set(days.map((d) => d.day));
  });

  const scopePool = useMemo(
    () =>
      days
        .filter((d) => selected.has(d.day))
        .flatMap((d) => d.questions.map((q) => ({ ...q, day: d.day }))),
    [days, selected],
  );

  const [items, setItems] = useState<QItem[]>([]);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scores = useRef<Record<string, boolean>>({});

  const start = (pool?: QItem[]) => {
    const source = pool ?? scopePool;
    if (source.length === 0) return;
    const picked = shuffle(source).slice(0, Math.min(QUIZ_SIZE, source.length));
    setItems(picked);
    setPos(0);
    setRevealed(false);
    scores.current = {};
    setPhase('quiz');
  };

  const current = items[pos];

  const answer = useCallback(
    (correct: boolean) => {
      if (!current) return;
      scores.current[current.id] = correct;
      if (pos + 1 >= items.length) {
        const score = Object.values(scores.current).filter(Boolean).length;
        addQuizResult({
          date: new Date().toISOString(),
          score,
          total: items.length,
          days: [...selected].sort((a, b) => a - b),
        });
        setPhase('score');
      } else {
        setPos((p) => p + 1);
        setRevealed(false);
      }
    },
    [current, pos, items.length, addQuizResult, selected],
  );

  // Keys: Space reveal · 1 missed · 2 correct (spec §5).
  useEffect(() => {
    if (phase !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        setRevealed(true);
      } else if (e.key === '1' && revealed) answer(false);
      else if (e.key === '2' && revealed) answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, revealed, answer]);

  const allSelected = selected.size === days.length;

  // ── Build ──
  if (phase === 'build') {
    const scopeSmall = scopePool.length < QUIZ_SIZE;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 lg:pb-16">
        <h1 className="text-[28px] font-bold leading-8 tracking-tight">Quiz</h1>
        <p className="mt-1 text-sm text-text2">
          10 random questions from your chosen days. Reveal, then score yourself honestly — no
          multiple-choice guessing.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text2">Scope</div>
          <button
            type="button"
            onClick={() => setSelected(allSelected ? new Set() : new Set(days.map((d) => d.day)))}
            className="text-[13px] font-semibold text-link hover:underline"
          >
            {allSelected ? 'Clear all' : 'All 21 days'}
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

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={scopePool.length === 0}
            onClick={() => start()}
            className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-text3"
          >
            Start {Math.min(QUIZ_SIZE, scopePool.length)}-question quiz
          </button>
          {selected.size === 0 && <span className="text-[13px] text-text2">Pick at least one day.</span>}
          {selected.size > 0 && scopeSmall && scopePool.length > 0 && (
            <span className="text-[13px] text-text2">
              Only {scopePool.length} questions in this scope. Start a {scopePool.length}-question quiz,
              or widen to all days.
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Score ──
  if (phase === 'score') {
    const score = Object.values(scores.current).filter(Boolean).length;
    const missed = items.filter((it) => !scores.current[it.id]);
    const byDay = new Map<number, { correct: number; total: number }>();
    for (const it of items) {
      const rec = byDay.get(it.day) ?? { correct: 0, total: 0 };
      rec.total++;
      if (scores.current[it.id]) rec.correct++;
      byDay.set(it.day, rec);
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-12 pb-24 sm:px-6 lg:pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text2">Your score</div>
          <h1 className="mt-2 text-[40px] font-bold leading-none">
            {score} out of {items.length}
          </h1>
          <div className="mt-1 text-[15px] text-text2">{Math.round((score / items.length) * 100)}%</div>
        </div>

        <div className="mt-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text2">
            Per-day breakdown
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {[...byDay.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([day, rec], i) => (
                <div
                  key={day}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <span className="w-14 font-mono text-[12px] text-text2">Day {day}</span>
                  <span className="flex-1 text-sm">{days.find((d) => d.day === day)?.title}</span>
                  <span className={`text-sm font-semibold ${rec.correct === rec.total ? 'text-ok' : 'text-text2'}`}>
                    {rec.correct}/{rec.total}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {missed.length > 0 && (
            <button
              type="button"
              onClick={() => start(missed)}
              className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-strong"
            >
              Retake {missed.length} incorrect
            </button>
          )}
          <button
            type="button"
            onClick={() => start()}
            className="rounded-control border border-border-strong bg-surface px-6 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            New quiz
          </button>
          <button
            type="button"
            onClick={() => setPhase('build')}
            className="rounded-control border border-border-strong bg-surface px-6 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Change scope
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-8 pb-24 sm:px-6 lg:pb-16">
      <div className="flex items-center gap-3 text-[13px]">
        <span className="font-mono text-text2">
          Question {pos + 1} of {items.length}
        </span>
        <span className="flex-1" />
        <span className="hidden text-text3 sm:inline">
          <kbd>Space</kbd> reveal · <kbd>1</kbd> missed · <kbd>2</kbd> correct
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${(pos / items.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 rounded-card border border-border bg-surface p-7">
        <div className="font-mono text-[11.5px] text-text2">
          Day {current?.day} · {current?.id}
        </div>
        <p className="mt-2 text-xl font-semibold leading-7">{current?.question}</p>
        {revealed && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-text2">
              Model answer
            </div>
            <p className="text-[15px] leading-6 text-text">{current?.answer}</p>
          </div>
        )}
      </div>

      {revealed ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => answer(false)}
            className="flex-1 rounded-control border border-crit-text bg-crit-bg py-3 text-sm font-semibold text-crit-text"
          >
            I missed it <kbd>1</kbd>
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="flex-1 rounded-control border border-ok bg-ok-bg py-3 text-sm font-semibold text-ok"
          >
            I got it <kbd>2</kbd>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-4 rounded-control bg-primary py-3 text-sm font-semibold text-on-primary hover:bg-primary-strong"
        >
          Reveal answer <kbd>Space</kbd>
        </button>
      )}
    </div>
  );
}
