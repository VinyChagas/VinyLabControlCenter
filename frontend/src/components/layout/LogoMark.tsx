export function LogoMark() {
  return (
    <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="logo-ring" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#168BFF" />
          <stop offset="48%" stopColor="#168BFF" />
          <stop offset="52%" stopColor="#FF7900" />
          <stop offset="100%" stopColor="#FF7900" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="15" fill="none" stroke="url(#logo-ring)" strokeWidth="2.4" />
      <circle cx="18" cy="18" r="5.2" fill="#0A6EFF" />
      <circle cx="20.4" cy="18" r="5.2" fill="#FF7900" />
      <circle cx="18" cy="18" r="3.2" fill="#05090F" />
    </svg>
  );
}
