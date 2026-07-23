import type { Priority } from '../types';
import { useToast } from '../lib/toast';

// ── Priority badge — tinted bg + strong text + 1px border; label always present. ──
const PRI_CLASS: Record<Priority, string> = {
  Critical: 'bg-crit-bg text-crit-text border-crit-text',
  High: 'bg-high-bg text-high-text border-high-text',
  Medium: 'bg-med-bg text-med-text border-med-text',
  Low: 'bg-low-bg text-low-text border-low-text',
};

export function PriorityBadge({ priority, className = '' }: { priority: Priority; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-[9px] text-[11.5px] font-bold leading-5 ${PRI_CLASS[priority]} ${className}`}
    >
      {priority}
    </span>
  );
}

// ── T-code chip — monospace; click copies, toast "{tcode} copied" (spec §1). ──
export function TcodeChip({ code, muted = false }: { code: string; muted?: boolean }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard blocked — copy is best-effort */
    }
    toast(`${code} copied`);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy t-code ${code}`}
      className={`rounded-[5px] border px-2 py-[3px] font-mono text-[11.5px] font-medium transition-colors hover:border-primary hover:text-primary ${
        muted
          ? 'border-border bg-surface2 text-text2'
          : 'border-border-strong bg-surface2 text-text'
      }`}
    >
      {code}
    </button>
  );
}

// ── Progress ring — decorative (aria-hidden); paired text carries the value. ──
export function ProgressRing({
  value,
  total,
  size = 52,
  stroke = 6,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  const dash = circ * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="flex-none">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct >= 1 ? 'var(--c-ok)' : 'var(--c-primary)'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray var(--motion)' }}
      />
    </svg>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text2">{children}</div>
  );
}
