export default function RpLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="hsl(var(--rw-h) var(--rw-s) 50%)" opacity="0.9" transform="rotate(-20 18 13)" />
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="hsl(var(--rw-h) var(--rw-s) 50%)" opacity="0.75" transform="rotate(20 18 13)" />
      <ellipse cx="18" cy="13" rx="4" ry="6" fill="hsl(var(--rw-h) var(--rw-s) 38%)" opacity="0.85" transform="rotate(0 18 13)" />
      <circle cx="18" cy="13" r="3" fill="hsl(var(--rw-h) var(--rw-s) 30%)" />
      <path d="M18 19 Q17 25 16 28" stroke="#5C4133" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 23 Q13 20 12 17 Q15 17 17 23Z" fill="#78B832" />
    </svg>
  );
}
