export default function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/40
        dark:border-slate-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80
        transition text-lg"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
