/**
 * Reusable AdSense placeholder.
 *
 * Drop <AdSlot slot="header-banner" width={970} height={90} /> anywhere in
 * the layout and it reserves the exact box AdSense expects, preventing
 * layout shift once real ad units are wired in.
 *
 * To go live with real AdSense:
 *  1. Add the AdSense loader script to `index.html`
 *     (<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>)
 *  2. Replace the placeholder <div> below with an <ins class="adsbygoogle">
 *     tag using your ad-unit slot ID, and call `(adsbygoogle = window.adsbygoogle || []).push({})`
 *     in a useEffect. Every call site in this app stays the same.
 */

export type AdSlotName =
  | 'header-banner'
  | 'below-header-banner'
  | 'left-sidebar'
  | 'right-sidebar'
  | 'in-feed-native'
  | 'bottom-banner'
  | 'footer-responsive'
  | 'mobile-top-banner'
  | 'mobile-mid-banner'
  | 'mobile-sticky-bottom';

interface AdSlotProps {
  slot: AdSlotName;
  width: number;
  height: number;
  label?: string;
  className?: string;
  sticky?: boolean;
}

export default function AdSlot({ slot, width, height, label, className = '', sticky = false }: AdSlotProps) {
  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      data-ad-slot={slot}
      className={`ad-slot glass-card flex flex-col items-center justify-center text-center
        border-dashed border-2 border-slate-300/60 dark:border-slate-700/60
        text-slate-400 dark:text-slate-500 select-none overflow-hidden
        ${sticky ? 'fixed left-0 right-0 bottom-0 z-30' : ''} ${className}`}
      style={{
        width: '100%',
        maxWidth: width,
        minHeight: height,
        margin: sticky ? 0 : '0 auto',
      }}
    >
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">Advertisement</span>
      <span className="text-xs mt-1 opacity-60">
        {label ?? 'Google AdSense Placeholder'} · {width}×{height}
      </span>
      <span className="text-[10px] mt-0.5 opacity-40">Replace with AdSense code</span>
    </div>
  );
}
