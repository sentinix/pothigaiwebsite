export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="#3f5a36" />
      <path d="M32 50c-9-6-13-14-11-24 8 1 13 6 15 13 1-9 6-15 14-17 1 13-6 23-18 28z" fill="#f3e3c3" />
      <path d="M32 50c0-9 2-16 8-23" stroke="#3f5a36" strokeWidth="2" fill="none" />
    </svg>
  );
}
