import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import AdPageShell from '../components/ads/AdPageShell';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>📶</span>
          <span className="font-bold text-lg">WiFi Text Share</span>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <AdPageShell>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-brand-700">
            WiFi Text Share
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mb-10 text-sm sm:text-base">
            Share text instantly and in real time — with everyone on your WiFi, or privately in a
            password-protected room. No accounts, no sign-up.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
            <Link
              to="/wifi"
              className="group glass-card p-8 text-left hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-slide-up"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl shadow-lg shadow-brand-500/30 mb-4">
                📡
              </div>
              <h2 className="text-xl font-bold mb-2">Join Local WiFi Network</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Share instantly with everyone connected to the same WiFi. No login, no room code —
                just open the page.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-brand-600 dark:text-brand-400 text-sm font-semibold group-hover:gap-2 transition-all">
                Join now →
              </span>
            </Link>

            <Link
              to="/room"
              className="group glass-card p-8 text-left hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-slide-up"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center text-2xl shadow-lg shadow-fuchsia-500/30 mb-4">
                🔒
              </div>
              <h2 className="text-xl font-bold mb-2">Create / Join Private Room</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a password-protected room or join an existing one with a Room ID — works
                over the internet, not just local WiFi.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold group-hover:gap-2 transition-all">
                Get started →
              </span>
            </Link>
          </div>
        </main>
      </AdPageShell>
    </div>
  );
}
