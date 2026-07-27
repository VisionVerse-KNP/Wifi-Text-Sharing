import { FormEvent, useState } from 'react';

interface Props {
  onSubmit: (name: string) => void;
}

export default function NameGate({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 30;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 sm:p-10 animate-slide-up">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-3xl shadow-lg shadow-brand-500/30">
            📶
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">WiFi Text Share</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Instantly share text with everyone on this WiFi network. No account needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">
              What should we call you?
            </label>
            <input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya, Desk 3, Room A..."
              maxLength={30}
              className="w-full rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200
                dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base
                placeholder:text-slate-400"
            />
            {touched && !isValid && (
              <p className="mt-1.5 text-sm text-red-500">Please enter a name (max 30 characters).</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-brand-500
              to-brand-700 hover:from-brand-600 hover:to-brand-800 active:scale-[0.98] transition
              shadow-lg shadow-brand-500/30"
          >
            Join the shared board
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-slate-400 dark:text-slate-500">
          Your name is stored only in this browser. Everyone on the same WiFi will see it.
        </p>
      </div>
    </div>
  );
}
