/** The mark: a planet's horizon with a jump arc over it. Decorative. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 19c4-3 16-3 20 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 16c1.5-9 10.5-9 12 0" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 3.4" />
      <circle cx="12" cy="7" r="2.2" fill="var(--accent)" />
    </svg>
  );
}
