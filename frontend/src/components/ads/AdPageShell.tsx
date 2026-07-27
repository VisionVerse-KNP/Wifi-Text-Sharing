import { ReactNode } from 'react';
import AdSlot from './AdSlot';

interface AdPageShellProps {
  children: ReactNode;
}

/**
 * Wraps page content with the full desktop + mobile AdSense layout called
 * out in the spec: header banner, below-header leaderboard, left/right
 * sidebars, bottom banner, footer responsive ad, and mobile-only banners
 * (top, mid, sticky-bottom). Content always gets the full remaining width.
 */
export default function AdPageShell({ children }: AdPageShellProps) {
  return (
    <>
      {/* Desktop header banner */}
      <div className="hidden md:flex justify-center px-4 pt-3">
        <AdSlot slot="header-banner" width={970} height={90} />
      </div>
      {/* Mobile top banner */}
      <div className="flex md:hidden justify-center px-3 pt-2">
        <AdSlot slot="mobile-top-banner" width={320} height={100} />
      </div>

      {/* Below-header leaderboard (desktop only, per spec) */}
      <div className="hidden lg:flex justify-center px-4 pt-3">
        <AdSlot slot="below-header-banner" width={728} height={90} />
      </div>

      <div className="w-full grid grid-cols-1 xl:grid-cols-[160px_minmax(0,1fr)_160px] gap-4 px-2 sm:px-4 py-4">
        <aside className="hidden xl:flex justify-center">
          <AdSlot slot="left-sidebar" width={160} height={600} className="sticky top-24" />
        </aside>

        <div className="min-w-0">
          {children}

          {/* Mobile mid-content banner */}
          <div className="flex md:hidden justify-center py-4">
            <AdSlot slot="mobile-mid-banner" width={300} height={250} />
          </div>

          {/* Desktop bottom banner */}
          <div className="hidden md:flex justify-center py-4">
            <AdSlot slot="bottom-banner" width={970} height={250} />
          </div>
        </div>

        <aside className="hidden xl:flex justify-center">
          <AdSlot slot="right-sidebar" width={160} height={600} className="sticky top-24" />
        </aside>
      </div>

      <footer className="px-4 pb-24 md:pb-8">
        <div className="flex justify-center">
          <AdSlot slot="footer-responsive" width={970} height={90} label="Footer Responsive Ad" />
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-4">
          WiFi Text Share — share text instantly, no login required.
        </p>
      </footer>

      {/* Mobile sticky bottom banner */}
      <div className="md:hidden">
        <AdSlot slot="mobile-sticky-bottom" width={320} height={50} sticky />
      </div>
    </>
  );
}
