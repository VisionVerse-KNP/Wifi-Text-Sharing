import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import AdPageShell from '../components/ads/AdPageShell';
import SEO from '../components/SEO';

const FAQ_ITEMS = [
  {
    question: 'Do I need to create an account to use WiFi Text Share?',
    answer:
      'No. Local WiFi sharing and private rooms both work without any sign-up — just enter a display name.',
  },
  {
    question: 'How does local WiFi sharing work?',
    answer:
      'Every device that opens the app on the same WiFi network is automatically placed in the same shared space, so messages and files sync instantly without any setup.',
  },
  {
    question: 'Can I share files, not just text?',
    answer:
      'Yes. Share images, PDFs, documents, spreadsheets, audio, video, and more — with drag-and-drop upload, previews, and downloads, both over local WiFi and in private rooms.',
  },
  {
    question: 'Can I share text and files privately with people not on my WiFi?',
    answer:
      'Yes. Create a password-protected private room and share the Room ID, password, or invite link with anyone, anywhere.',
  },
];

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Local WiFi Share — Instant WiFi Text & File Share, No Login"
        description="Local WiFi share made simple: share text and files instantly with everyone on your WiFi — no login, no accounts. Send messages, photos, and documents, or create a password-protected private room to share from anywhere."
        keywords={[
          'local wifi share',
          'local wifi text share',
          'wifi text share',
          'wifi file sharing',
          'share files over wifi',
          'file sharing app',
          'send files over wifi',
          'local network file sharing',
          'local network text sharing',
          'real-time text share',
          'private room file sharing',
          'no login file sharing',
          'LAN chat',
          'LAN file transfer',
          'instant messaging without account',
        ]}
        path="/"
        jsonLd={[FAQ_JSON_LD]}
      />

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
            Local WiFi Share — Text & File Share
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mb-10 text-sm sm:text-base">
            Share text and files instantly and in real time over your local WiFi — with everyone
            on the same network, or privately in a password-protected room. No accounts, no
            sign-up.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
            <Link
              to="/wifi"
              className="group glass-card p-8 text-left hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-slide-up"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl shadow-lg shadow-brand-500/30 mb-4">
                📡
              </div>
              <h2 className="text-xl font-bold mb-2">Share Text & Files Over Local WiFi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send messages, photos, and documents instantly with everyone connected to the same
                WiFi. No login, no room code — just open the page.
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
              <h2 className="text-xl font-bold mb-2">Private Room for Text & File Sharing</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a password-protected room to share messages and files, or join one with a
                Room ID — works over the internet, not just local WiFi.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold group-hover:gap-2 transition-all">
                Get started →
              </span>
            </Link>
          </div>

          <section aria-labelledby="faq-heading" className="w-full max-w-3xl mt-16 text-left">
            <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold mb-6 text-center">
              Frequently asked questions
            </h2>
            <div className="grid gap-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="glass-card p-5">
                  <h3 className="font-semibold text-sm sm:text-base mb-1.5">{item.question}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </AdPageShell>
    </div>
  );
}
