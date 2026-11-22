/** Two lines, stock (white) and sentiment (amber), in a rounded square. */
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <rect x="1" y="1" width="28" height="28" rx="7" fill="var(--panel)" stroke="var(--line-strong)" />
      <polyline
        points="6,20 11,15 15,17 23,8"
        fill="none"
        stroke="var(--stock)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="6,13 11,17 15,12 23,14"
        fill="none"
        stroke="var(--sentiment)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
