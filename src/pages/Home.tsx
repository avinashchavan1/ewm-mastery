import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { groupFor, PRIORITY_ORDER } from '../data/groups';
import { PriorityBadge, ProgressRing, SectionLabel } from '../components/primitives';
import { useSeo } from '../lib/seo';
import { SITE_URL, SITE_NAME, AUTHOR, incidentPath } from '../lib/site';

export default function Home() {
  const { meta, incidents, days } = useData();
  const { progress, session, isReviewed, reviewedCount } = useProgress();

  useSeo({
    title: 'EWM Mastery — Free SAP EWM Support & Interview Prep',
    description:
      'Free, offline SAP EWM prep: 26 real support incident runbooks, 21 study days, 630 interview questions & answers, flashcards, quizzes and governance templates. No login.',
    path: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description:
          'Free SAP EWM support incident runbooks and 630 interview questions with answers.',
        inLanguage: 'en',
        author: { '@type': 'Person', name: AUTHOR },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'SAP EWM 21-Day Interview Prep',
        description: '21 days of SAP EWM interview questions and answers — 630 questions total.',
        provider: { '@type': 'Person', name: AUTHOR },
        url: `${SITE_URL}/prep`,
      },
    ],
  });

  const stats = useMemo(() => {
    const reviewed = Object.keys(progress.reviewed).length;
    const daysCompleted = days.filter((d) => d.questions.every((q) => isReviewed(q.id))).length;
    const last3 = progress.quizHistory.slice(0, 3);
    const avgQuiz =
      last3.length > 0
        ? Math.round((last3.reduce((s, r) => s + r.score, 0) / last3.length) * 10) / 10
        : null;
    return { reviewed, daysCompleted, avgQuiz, quizCount: last3.length };
  }, [progress, days, isReviewed]);

  // Resume target: explicit session day, else the most-advanced partially-done day.
  const resume = useMemo(() => {
    let day = session && session.type === 'day' ? days.find((d) => d.day === session.day) : undefined;
    if (!day) {
      const partial = days
        .map((d) => ({ d, done: reviewedCount(d.questions.map((q) => q.id)) }))
        .filter((x) => x.done > 0 && x.done < x.d.questions.length)
        .sort((a, b) => b.d.day - a.d.day);
      day = partial[0]?.d;
    }
    if (!day) return null;
    const done = reviewedCount(day.questions.map((q) => q.id));
    const nextQ = day.questions.find((q) => !isReviewed(q.id));
    return { day, done, total: day.questions.length, nextQ };
  }, [session, days, reviewedCount, isReviewed]);

  const hasProgress = stats.reviewed > 0 || progress.quizHistory.length > 0;

  const hotIncidents = useMemo(
    () =>
      [...incidents]
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.id.localeCompare(b.id))
        .slice(0, 3),
    [incidents],
  );

  const upNext = useMemo(() => {
    const withDone = days.map((d) => ({ d, done: reviewedCount(d.questions.map((q) => q.id)) }));
    const inProgress = withDone.filter((x) => x.done > 0 && x.done < x.d.questions.length);
    const notStarted = withDone.filter((x) => x.done === 0);
    return [...inProgress, ...notStarted].slice(0, 3);
  }, [days, reviewedCount]);

  if (!meta) return null;

  return (
    <div className="mx-auto max-w-shell px-4 py-9 pb-24 sm:px-6 lg:pb-16">
      {hasProgress ? (
        <div className="flex flex-col gap-7">
          <div>
            <h1 className="text-[28px] font-bold leading-8 tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-text2">
              {meta.incidents} support incidents · {meta.days} study days · {meta.totalQuestions}{' '}
              interview Q&amp;A — all offline, all yours.
            </p>
          </div>

          {resume && (
            <Link
              to={`/prep/day/${resume.day.day}${resume.nextQ ? `?q=${resume.nextQ.id}` : ''}`}
              className="flex items-center gap-5 rounded-card border border-primary bg-primary-tint px-6 py-5 no-underline transition-shadow hover:shadow-card"
              aria-label={`Continue Day ${resume.day.day}, ${resume.day.title}, ${resume.done} of ${resume.total} reviewed`}
            >
              <ProgressRing value={resume.done} total={resume.total} size={56} />
              <div className="min-w-0 flex-1">
                <SectionLabel>Continue where you left off</SectionLabel>
                <div className="mt-0.5 truncate text-xl font-bold leading-7 text-text">
                  Day {resume.day.day} — {resume.day.title}
                </div>
                <div className="mt-0.5 truncate text-[13.5px] text-text2">
                  {resume.done} of {resume.total} reviewed
                  {resume.nextQ && ` · next: “${resume.nextQ.question}”`}
                </div>
              </div>
              <span className="hidden flex-none rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary sm:inline">
                Resume
              </span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value={`${stats.reviewed}`} sub={`/ ${meta.totalQuestions}`}>
              questions reviewed · {Math.round((stats.reviewed / meta.totalQuestions) * 100)}%
            </Stat>
            <Stat value={`${stats.daysCompleted}`} sub={`/ ${meta.days}`}>
              days completed
            </Stat>
            <Stat value={progress.streak >= 2 ? `${progress.streak} days` : '—'}>
              {progress.streak >= 2 ? 'study streak' : 'study streak (build it up!)'}
            </Stat>
            <Stat value={stats.avgQuiz !== null ? `${stats.avgQuiz}` : '—'} sub={stats.avgQuiz !== null ? '/ 10' : undefined}>
              {stats.avgQuiz !== null ? `average of last ${stats.quizCount} quiz${stats.quizCount > 1 ? 'zes' : ''}` : 'no quizzes yet'}
            </Stat>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="High-priority runbooks" link={{ to: '/incidents', label: 'All 26 →' }}>
              {hotIncidents.map((i) => (
                <Link
                  key={i.id}
                  to={incidentPath(i.id)}
                  className="block border-t border-border px-[18px] py-3 no-underline text-text transition-colors hover:bg-surface2"
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-mono text-[11.5px] text-text2">{i.id}</span>
                    <PriorityBadge priority={i.priority} />
                  </div>
                  <div className="text-sm font-semibold leading-5">{i.title}</div>
                  <div className="text-[12.5px] text-text2">
                    {groupFor(i.processArea)} · {i.processArea}
                  </div>
                </Link>
              ))}
            </Panel>

            <Panel title="Up next on the 21-day path" link={{ to: '/prep', label: 'Full plan →' }}>
              {upNext.map(({ d, done }) => (
                <Link
                  key={d.day}
                  to={`/prep/day/${d.day}`}
                  className="flex items-center gap-3 border-t border-border px-[18px] py-3 no-underline text-text transition-colors hover:bg-surface2"
                >
                  <span className="w-[52px] font-mono text-[11.5px] text-text2">Day {d.day}</span>
                  <span className="flex-1 text-sm font-semibold">{d.title}</span>
                  <span className="text-[12.5px] text-text2">
                    {done > 0 ? `${done}/${d.questions.length}` : `${d.questions.length}`}
                  </span>
                </Link>
              ))}
              <div className="flex gap-2.5 border-t border-border px-[18px] py-3">
                <Link
                  to="/quiz"
                  className="flex-1 rounded-control border border-border-strong py-2 text-center text-[13.5px] font-semibold no-underline text-text transition-colors hover:border-primary hover:text-primary"
                >
                  Start a quiz
                </Link>
                <Link
                  to="/flashcards"
                  className="flex-1 rounded-control border border-border-strong py-2 text-center text-[13.5px] font-semibold no-underline text-text transition-colors hover:border-primary hover:text-primary"
                >
                  Build a deck
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
          <h1 className="mt-6 text-[30px] font-bold leading-9 tracking-tight">
            Master SAP EWM support &amp; interviews
          </h1>
          <p className="mb-3 text-[15px] leading-6 text-text2">
            Free, offline prep — {meta.incidents} real support incidents, {meta.days} study days,{' '}
            {meta.totalQuestions} interview Q&amp;A by {meta.author}. No login; progress stays in this
            browser.
          </p>
          <FeatureCard
            to="/prep"
            title="Take the 21-day path"
            desc={`Day 1 — ${days[0]?.title ?? 'SAP EWM Overview'} · 30 questions`}
            primary
          />
          <FeatureCard
            to="/quiz"
            title="In an interview crunch?"
            desc="Probe your gaps with a 10-question quiz, then drill the misses"
          />
          <FeatureCard
            to="/incidents"
            title="Working a ticket?"
            desc="Search 26 incident runbooks by symptom, t-code, or process area"
          />
        </div>
      )}
    </div>
  );
}

function Stat({ value, sub, children }: { value: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface px-[18px] py-4">
      <div className="text-[22px] font-bold">
        {value} {sub && <span className="text-sm font-semibold text-text2">{sub}</span>}
      </div>
      <div className="mt-0.5 text-[12.5px] text-text2">{children}</div>
    </div>
  );
}

function Panel({
  title,
  link,
  children,
}: {
  title: string;
  link: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center border-b border-border px-[18px] py-3.5">
        <SectionLabel>{title}</SectionLabel>
        <span className="flex-1" />
        <Link to={link.to} className="text-[13px] font-semibold no-underline">
          {link.label}
        </Link>
      </div>
      {children}
    </div>
  );
}

function FeatureCard({
  to,
  title,
  desc,
  primary = false,
}: {
  to: string;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-card border p-[18px] text-left no-underline text-text transition-shadow hover:shadow-card ${
        primary ? 'border-primary bg-primary-tint' : 'border-border bg-surface hover:border-primary'
      }`}
    >
      <b className="text-base">{title}</b>
      <div className="mt-0.5 text-[13.5px] text-text2">{desc}</div>
    </Link>
  );
}
