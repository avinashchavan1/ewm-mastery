import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { ProgressRing } from '../components/primitives';
import { useSeo } from '../lib/seo';

export default function Prep() {
  const { meta, days } = useData();
  const { reviewedCount } = useProgress();

  useSeo({
    title: 'SAP EWM 21-Day Interview Prep — 630 Questions',
    description:
      'A structured 21-day SAP EWM interview study plan: 630 questions with model answers across architecture, inbound, outbound, RF, MFS, physical inventory and more.',
    path: '/prep',
  });

  const perDay = useMemo(
    () => days.map((d) => ({ d, done: reviewedCount(d.questions.map((q) => q.id)) })),
    [days, reviewedCount],
  );
  const totalReviewed = perDay.reduce((s, x) => s + x.done, 0);
  const totalQ = meta?.totalQuestions ?? 630;
  const pct = Math.round((totalReviewed / totalQ) * 100);
  const anyProgress = totalReviewed > 0;

  return (
    <div className="mx-auto max-w-shell px-4 py-8 pb-24 sm:px-6 lg:pb-16">
      <div className="mb-1 flex flex-wrap items-end gap-x-3">
        <h1 className="text-[28px] font-bold leading-8 tracking-tight">21-Day Interview Prep</h1>
        <span className="pb-1 text-sm text-text2">630 questions across 21 focused days</span>
      </div>

      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Overall progress</span>
          <span className="font-mono text-text2">
            {totalReviewed} / {totalQ} · {pct}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={totalReviewed} aria-valuemin={0} aria-valuemax={totalQ} aria-label="Questions reviewed">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!anyProgress && (
          <p className="mt-2 text-[13px] text-text2">Nothing tracked yet. Open any day — none are locked.</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {perDay.map(({ d, done }) => {
          const complete = done === d.questions.length;
          return (
            <Link
              key={d.day}
              to={`/prep/day/${d.day}`}
              className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 no-underline text-text transition-all hover:border-primary hover:shadow-card"
            >
              <ProgressRing value={done} total={d.questions.length} size={48} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11.5px] text-text2">
                  Day {d.day}
                  {complete && <span className="ml-1.5 text-ok">✓ done</span>}
                </div>
                <div className="truncate text-[15px] font-semibold leading-5">{d.title}</div>
                <div className="mt-0.5 text-[12.5px] text-text2">
                  {done} / {d.questions.length} reviewed
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/flashcards"
          className="rounded-control border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold no-underline text-text transition-colors hover:border-primary hover:text-primary"
        >
          Build a flashcard deck →
        </Link>
        <Link
          to="/quiz"
          className="rounded-control border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold no-underline text-text transition-colors hover:border-primary hover:text-primary"
        >
          Take a quiz →
        </Link>
      </div>
    </div>
  );
}
