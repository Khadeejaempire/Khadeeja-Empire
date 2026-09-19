function AnnouncementSequence({ messages, hidden = false }: { messages: string[]; hidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {messages.map((message) => (
        <span key={message} className="flex items-center whitespace-nowrap">
          <span className="text-[11.5px] sm:text-xs font-medium uppercase tracking-[0.17em] text-white">
            {message}
          </span>
          <span className="mx-8 text-[11px] text-white" aria-hidden="true">
            •
          </span>
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div
      className="relative z-[var(--z-announcement)] h-[38px] overflow-hidden bg-maroon"
      role="region"
      aria-label="Store announcements"
    >
      <div className="marquee-track mx-auto flex w-max min-w-full items-center justify-center py-2">
        <AnnouncementSequence messages={messages} />
        <AnnouncementSequence messages={messages} hidden />
      </div>
    </div>
  );
}
