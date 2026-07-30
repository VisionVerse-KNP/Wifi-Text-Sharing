import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  useSEO({
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist. Head back to WiFi Text Share.",
    path: '/404',
    robots: 'noindex, nofollow',
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        <div className="text-4xl mb-3">🧭</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          That page doesn't exist. Let's get you back to sharing text.
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-700"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
