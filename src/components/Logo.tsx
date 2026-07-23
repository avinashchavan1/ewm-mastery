// Brand mark — rounded square badge with "EWM", optional wordmark.
// Uses currentColor-independent brand fill so it reads on light + dark.
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="EWM Mastery logo"
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#1F4E79" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        fontSize="21"
        fontWeight="800"
        letterSpacing="-1"
        fill="#FFFFFF"
      >
        EWM
      </text>
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={28} className="flex-none" />
      <span className="text-[15px] font-bold tracking-tight text-text">EWM Mastery</span>
    </span>
  );
}
