export function SpoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <line x1="6" y1="7.5" x2="18" y2="7.5" />
      <line x1="6" y1="11" x2="18" y2="11" />
      <line x1="6" y1="14.5" x2="18" y2="14.5" />
      <line x1="6" y1="18" x2="18" y2="18" />
    </svg>
  );
}

export function RosetteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 5v14M5 12h14M7.05 7.05l9.9 9.9M16.95 7.05l-9.9 9.9" />
    </svg>
  );
}
