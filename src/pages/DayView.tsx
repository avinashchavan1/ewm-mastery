import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { ProgressRing } from '../components/primitives';
import { useSeo, breadcrumb } from '../lib/seo';

export default function DayView() {
  const { day } = useParams();
  const dayNum = Number(day);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { days } = useData();
  const { isReviewed, toggleReviewed, markReviewed, reviewedCount, setSession } = useProgress();

  const dayData = days.find((d) => d.day === dayNum);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const questions = useMemo(() => dayData?.questions ?? [], [dayData]);
  const done = dayData ? reviewedCount(questions.map((q) => q.id)) : 0;

  // Persist session + honor ?q= anchor.
  useEffect(() => {
    if (!dayData) return;
    const anchor = params.get('q') ?? undefined;
    setSession({ type: 'day', day: dayNum, lastQ: anchor });
    if (anchor) {
      setOpen(new Set([anchor]));
      const i = questions.findIndex((q) => q.id === anchor);
      if (i >= 0) {
        setActiveIdx(i);
        window.setTimeout(() => rowRefs.current[anchor]?.scrollIntoView({ block: 'center' }), 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNum, dayData]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const expandAll = () => setOpen(new Set(questions.map((q) => q.id)));
  const collapseAll = () => setOpen(new Set());

  // Mark reviewed, then move focus to next unreviewed row (spec §4).
  const reviewAndAdvance = (id: string) => {
    markReviewed(id);
    const nextUn = questions.find((q) => q.id !== id && !isReviewed(q.id));
    if (nextUn) window.setTimeout(() => rowRefs.current[nextUn.id]?.focus(), 0);
  };

  // Keyboard map: j/k question nav, Enter toggle, r mark, Esc collapse, ←/→ day nav.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'j') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, questions.length - 1));
      } else if (e.key === 'k') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && questions[activeIdx]) {
        toggle(questions[activeIdx].id);
      } else if (e.key === 'r' && questions[activeIdx]) {
        reviewAndAdvance(questions[activeIdx].id);
      } else if (e.key === 'Escape') {
        collapseAll();
      } else if (e.key === 'ArrowLeft' && dayNum > 1) {
        navigate(`/prep/day/${dayNum - 1}`);
      } else if (e.key === 'ArrowRight' && dayNum < days.length) {
        navigate(`/prep/day/${dayNum + 1}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, activeIdx, dayNum, days.length]);

  useEffect(() => {
    const q = questions[activeIdx];
    if (q) rowRefs.current[q.id]?.focus({ preventScroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  useSeo(
    dayData
      ? {
          title: `Day ${dayData.day}: ${dayData.title} — SAP EWM Q&A`,
          description: `Day ${dayData.day} of SAP EWM interview prep: ${questions.length} questions and answers on ${dayData.title}.`,
          path: `/prep/day/${dayData.day}`,
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              name: `SAP EWM interview questions — Day ${dayData.day}: ${dayData.title}`,
              mainEntity: questions.map((q) => ({
                '@type': 'Question',
                name: q.question,
                acceptedAnswer: { '@type': 'Answer', text: q.answer },
              })),
            },
            breadcrumb([
              { name: 'Home', path: '/' },
              { name: '21-Day Prep', path: '/prep' },
              { name: `Day ${dayData.day}`, path: `/prep/day/${dayData.day}` },
            ]),
          ],
        }
      : { title: 'Day not found', description: 'Study day not found.', path: '/prep', noindex: true },
  );

  if (!dayData) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Day not found</h1>
        <Link to="/prep" className="mt-3 inline-block font-semibold">
          ← Back to 21-day plan
        </Link>
      </div>
    );
  }

  const allOpen = open.size === questions.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 pb-24 sm:px-6 lg:pb-16">
      <div className="mb-4 flex items-center gap-3 text-[13px]">
        <Link to="/prep" className="font-semibold no-underline hover:text-primary">
          ← 21-day plan
        </Link>
        <span className="flex-1" />
        <span className="hidden text-text3 sm:inline">
          <kbd>j</kbd>/<kbd>k</kbd> move · <kbd>Enter</kbd> open · <kbd>r</kbd> review · <kbd>←</kbd>/
          <kbd>→</kbd> day
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={done} total={questions.length} size={52} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11.5px] text-text2">Day {dayData.day}</div>
          <h1 className="text-[22px] font-bold leading-7">{dayData.title}</h1>
          <div className="text-[13px] text-text2">
            {done} / {questions.length} reviewed
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={allOpen ? collapseAll : expandAll}
          className="rounded-control border border-border-strong bg-surface px-4 py-2 text-[13px] font-semibold transition-colors hover:border-primary hover:text-primary"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
        <span className="text-[12.5px] text-text2">Interview Q&amp;A ({questions.length})</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        {questions.map((q, i) => {
          const isOpen = open.has(q.id);
          const reviewed = isReviewed(q.id);
          return (
            <div key={q.id} className={i > 0 ? 'border-t border-border' : ''}>
              <h3>
                <button
                  ref={(el) => (rowRefs.current[q.id] = el)}
                  type="button"
                  onClick={() => {
                    toggle(q.id);
                    setActiveIdx(i);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`ans-${q.id}`}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface2"
                >
                  <span className={`w-4 flex-none font-bold ${reviewed ? 'text-ok' : 'text-transparent'}`}>
                    ✓
                  </span>
                  <span className="flex-none font-mono text-[11.5px] text-text2">
                    {q.id.split('-')[1]}
                  </span>
                  <span className={`flex-1 text-[14.5px] ${reviewed ? 'text-text2' : 'font-medium text-text'}`}>
                    {q.question}
                  </span>
                  <span
                    className="flex-none text-xs text-text3 transition-transform"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    aria-hidden
                  >
                    ▸
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div id={`ans-${q.id}`} className="border-t border-border bg-surface2 px-4 py-3.5">
                  <p className="ml-[26px] text-[14.5px] leading-6 text-text">{q.answer}</p>
                  <div className="ml-[26px] mt-3">
                    <button
                      type="button"
                      onClick={() => (reviewed ? toggleReviewed(q.id) : reviewAndAdvance(q.id))}
                      aria-pressed={reviewed}
                      className={`rounded-control border px-4 py-2 text-[13px] font-semibold transition-colors ${
                        reviewed
                          ? 'border-ok bg-ok-bg text-ok'
                          : 'border-transparent bg-primary text-on-primary hover:bg-primary-strong'
                      }`}
                    >
                      {reviewed ? '✓ Reviewed — undo' : 'Mark reviewed ✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <nav className="mt-8 flex items-stretch gap-3" aria-label="Day pagination">
        {dayNum > 1 ? (
          <Link
            to={`/prep/day/${dayNum - 1}`}
            className="flex-1 rounded-card border border-border bg-surface p-4 no-underline text-text transition-colors hover:border-primary"
          >
            <div className="text-xs text-text2">← Day {dayNum - 1}</div>
            <div className="mt-0.5 text-sm font-semibold leading-5">
              {days.find((d) => d.day === dayNum - 1)?.title}
            </div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {dayNum < days.length ? (
          <Link
            to={`/prep/day/${dayNum + 1}`}
            className="flex-1 rounded-card border border-border bg-surface p-4 text-right no-underline text-text transition-colors hover:border-primary"
          >
            <div className="text-xs text-text2">Day {dayNum + 1} →</div>
            <div className="mt-0.5 text-sm font-semibold leading-5">
              {days.find((d) => d.day === dayNum + 1)?.title}
            </div>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
