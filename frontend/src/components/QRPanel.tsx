import { useState } from 'react';

export default function QRPanel() {
  const [open, setOpen] = useState(false);
  const currentUrl = window.location.href;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Show QR code"
        className="w-9 h-9 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/40
          dark:border-slate-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-800/80
          transition text-lg"
      >
        📱
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 glass-card p-4 z-40 animate-slide-up text-center"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="text-sm font-semibold mb-2">Scan to join on another device</p>
          <img
            src={qrSrc}
            alt="QR code linking to this page"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 mb-2"
            loading="lazy"
          />
          <p className="text-xs text-slate-400 break-all">{currentUrl}</p>
          <p className="text-[11px] text-slate-400 mt-1">Requires internet access to render the QR image.</p>
        </div>
      )}
    </div>
  );
}
