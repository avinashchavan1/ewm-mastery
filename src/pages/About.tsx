import { useState } from 'react';
import { useData } from '../data/DataContext';
import { useProgress } from '../lib/progress';
import { useToast } from '../lib/toast';
import { useSeo } from '../lib/seo';

const SHORTCUTS: [string, string][] = [
  ['⌘K / Ctrl+K', 'Open global search'],
  ['Esc', 'Close overlay / collapse'],
  ['j / k', 'Day view: next / previous question'],
  ['Enter', 'Day view: expand / collapse question'],
  ['r', 'Day view: mark reviewed'],
  ['← / →', 'Day view: previous / next day'],
  ['[ / ]', 'Incident detail: previous / next incident'],
  ['Space', 'Flashcards / Quiz: flip / reveal'],
  ['1 / 2', 'Flashcards / Quiz: review-again / got-it'],
];

export default function About() {
  const { meta } = useData();
  const { progress, resetAll } = useProgress();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const reviewedCount = Object.keys(progress.reviewed).length;

  useSeo({
    title: 'About EWM Mastery',
    description:
      'EWM Mastery is a free, offline SAP EWM study app by Avinash Chavan — 26 incident runbooks, 630 interview Q&A, flashcards, quizzes and templates. No login, no tracking.',
    path: '/about',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 lg:pb-16">
      <h1 className="text-[28px] font-bold leading-8 tracking-tight">About EWM Mastery</h1>

      <div className="mt-4 flex flex-col gap-3 text-[15px] leading-6 text-text">
        <p>
          <b>EWM Mastery</b> is a free, offline study companion for SAP EWM support consultants and
          interview candidates, built by <b>{meta?.author ?? 'Avinash Chavan'}</b>. It bundles{' '}
          {meta?.incidents ?? 26} realistic support incidents written as runbooks,{' '}
          {meta?.days ?? 21} days of structured interview prep ({meta?.totalQuestions ?? 630}{' '}
          questions), flashcards, quizzes, and downloadable governance templates.
        </p>
        <p>
          There is no login, no signup, no backend, and no tracking. Everything runs in your browser
          and all content ships as static files. Your progress — reviewed questions, streak, quiz
          history — is saved only in this browser’s local storage.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Keyboard shortcuts</h2>
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {SHORTCUTS.map(([k, d], i) => (
            <div key={k} className={`flex items-center gap-4 px-4 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
              <span className="w-32 flex-none">
                <kbd>{k}</kbd>
              </span>
              <span className="text-sm text-text2">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-base font-semibold">Your data</h2>
        <p className="text-[13.5px] text-text2">
          {reviewedCount} reviewed answers · streak {progress.streak} · {progress.quizHistory.length}{' '}
          quizzes recorded on this browser.
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-control border border-crit-text bg-crit-bg px-4 py-2 text-[13.5px] font-semibold text-crit-text"
          >
            Reset all progress
          </button>
        ) : (
          <div className="mt-3 rounded-card border border-crit-text bg-crit-bg p-4">
            <p className="text-[13.5px] font-semibold text-crit-text">
              Delete all progress on this browser? {reviewedCount} reviewed answers, streak, and session
              history will be gone. There is no undo.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setConfirming(false);
                  toast('Progress deleted');
                }}
                className="rounded-control bg-crit-text px-4 py-2 text-[13.5px] font-semibold text-white"
              >
                Delete everything
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-control border border-border-strong bg-surface px-4 py-2 text-[13.5px] font-semibold"
              >
                Keep my progress
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-card border border-border bg-surface2 p-4">
        <h2 className="mb-1.5 text-sm font-semibold">Disclaimer</h2>
        <p className="text-[13px] leading-5 text-text2">
          Scenarios are realistic composites written for training purposes; not affiliated with or
          endorsed by SAP SE. SAP, SAP EWM and S/4HANA are trademarks of SAP SE.
        </p>
      </section>
    </div>
  );
}
