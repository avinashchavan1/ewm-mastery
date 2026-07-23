import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ── localStorage schema — ground truth: ux/06-ux-spec.md §3. All keys "ewm.". ──
const K = {
  version: 'ewm.version',
  progress: 'ewm.progress',
  session: 'ewm.session',
  recent: 'ewm.recent',
} as const;
const SCHEMA_VERSION = 2;

export interface QuizResult {
  date: string; // ISO
  score: number;
  total: number;
  days: number[];
}

export interface ProgressData {
  reviewed: Record<string, number>; // questionId → epoch seconds
  streak: number;
  lastActiveDate: string; // "YYYY-MM-DD" (local)
  quizHistory: QuizResult[];
}

export type Session =
  | null
  | { type: 'day'; day: number; lastQ?: string }
  | {
      type: 'cards';
      queue: string[];
      index: number;
      requeued: string[];
      startedAt: number;
    };

export interface RecentItem {
  type: 'incident' | 'day';
  id: string; // "EWM-001" or "12"
  label?: string;
}

const EMPTY: ProgressData = { reviewed: {}, streak: 0, lastActiveDate: '', quizHistory: [] };

function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86400000);
}

interface Ctx {
  progress: ProgressData;
  session: Session;
  recent: RecentItem[];
  storageOk: boolean;
  isReviewed: (id: string) => boolean;
  reviewedCount: (ids: string[]) => number;
  markReviewed: (id: string) => void;
  unmarkReviewed: (id: string) => void;
  toggleReviewed: (id: string) => void;
  registerActivity: () => void;
  addQuizResult: (r: QuizResult) => void;
  setSession: (s: Session) => void;
  pushRecent: (item: RecentItem) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [storageOk, setStorageOk] = useState(true);
  const [progress, setProgress] = useState<ProgressData>(EMPTY);
  const [session, setSessionState] = useState<Session>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const hydrated = useRef(false);

  // Hydrate once + run version migration.
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(K.version) || '0');
      if (v !== SCHEMA_VERSION) {
        // Unknown version: drop volatile session, keep reviewed progress if present.
        localStorage.removeItem(K.session);
        localStorage.setItem(K.version, String(SCHEMA_VERSION));
      }
      setProgress(read<ProgressData>(K.progress, EMPTY));
      setSessionState(read<Session>(K.session, null));
      setRecent(read<RecentItem[]>(K.recent, []));
    } catch {
      setStorageOk(false);
    }
    hydrated.current = true;
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      setStorageOk(false);
    }
  }, []);

  // Streak bookkeeping — folded into any review/grade event (spec §2).
  const bumpStreak = useCallback((p: ProgressData): ProgressData => {
    const today = todayLocal();
    if (p.lastActiveDate === today) return p;
    let streak = 1;
    if (p.lastActiveDate) {
      const gap = daysBetween(p.lastActiveDate, today);
      streak = gap === 1 ? p.streak + 1 : 1;
    }
    return { ...p, streak, lastActiveDate: today };
  }, []);

  const markReviewed = useCallback(
    (id: string) => {
      setProgress((p) => {
        if (p.reviewed[id]) return p;
        const next = bumpStreak({
          ...p,
          reviewed: { ...p.reviewed, [id]: Math.floor(Date.now() / 1000) },
        });
        persist(K.progress, next);
        return next;
      });
    },
    [bumpStreak, persist],
  );

  const unmarkReviewed = useCallback(
    (id: string) => {
      setProgress((p) => {
        if (!p.reviewed[id]) return p;
        const reviewed = { ...p.reviewed };
        delete reviewed[id];
        const next = { ...p, reviewed };
        persist(K.progress, next);
        return next;
      });
    },
    [persist],
  );

  const toggleReviewed = useCallback(
    (id: string) => {
      setProgress((p) => {
        const reviewed = { ...p.reviewed };
        let next: ProgressData;
        if (reviewed[id]) {
          delete reviewed[id];
          next = { ...p, reviewed };
        } else {
          reviewed[id] = Math.floor(Date.now() / 1000);
          next = bumpStreak({ ...p, reviewed });
        }
        persist(K.progress, next);
        return next;
      });
    },
    [bumpStreak, persist],
  );

  const registerActivity = useCallback(() => {
    setProgress((p) => {
      const next = bumpStreak(p);
      if (next === p) return p;
      persist(K.progress, next);
      return next;
    });
  }, [bumpStreak, persist]);

  const addQuizResult = useCallback(
    (r: QuizResult) => {
      setProgress((p) => {
        const next = bumpStreak({ ...p, quizHistory: [r, ...p.quizHistory].slice(0, 10) });
        persist(K.progress, next);
        return next;
      });
    },
    [bumpStreak, persist],
  );

  const setSession = useCallback(
    (s: Session) => {
      setSessionState(s);
      if (s === null) {
        try {
          localStorage.removeItem(K.session);
        } catch {
          /* ignore */
        }
      } else {
        persist(K.session, s);
      }
    },
    [persist],
  );

  const pushRecent = useCallback(
    (item: RecentItem) => {
      setRecent((r) => {
        const deduped = [item, ...r.filter((x) => !(x.type === item.type && x.id === item.id))].slice(0, 5);
        persist(K.recent, deduped);
        return deduped;
      });
    },
    [persist],
  );

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(K.progress);
      localStorage.removeItem(K.session);
      localStorage.removeItem(K.recent);
    } catch {
      /* ignore */
    }
    setProgress(EMPTY);
    setSessionState(null);
    setRecent([]);
  }, []);

  const isReviewed = useCallback((id: string) => !!progress.reviewed[id], [progress.reviewed]);
  const reviewedCount = useCallback(
    (ids: string[]) => ids.reduce((n, id) => n + (progress.reviewed[id] ? 1 : 0), 0),
    [progress.reviewed],
  );

  const value = useMemo<Ctx>(
    () => ({
      progress,
      session,
      recent,
      storageOk,
      isReviewed,
      reviewedCount,
      markReviewed,
      unmarkReviewed,
      toggleReviewed,
      registerActivity,
      addQuizResult,
      setSession,
      pushRecent,
      resetAll,
    }),
    [
      progress, session, recent, storageOk, isReviewed, reviewedCount, markReviewed,
      unmarkReviewed, toggleReviewed, registerActivity, addQuizResult, setSession, pushRecent, resetAll,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
