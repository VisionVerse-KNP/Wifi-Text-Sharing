export default function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return <div className="h-5" />;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names.length} people are typing`;

  return (
    <div className="h-5 flex items-center gap-1.5 text-xs text-slate-400 animate-fade-in px-1">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
      </span>
      {label}…
    </div>
  );
}
