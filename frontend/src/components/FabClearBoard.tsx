export default function FabClearBoard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Clear board"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600
        text-white text-2xl shadow-lg shadow-red-500/40 flex items-center justify-center
        hover:scale-105 active:scale-95 transition"
    >
      🗑️
    </button>
  );
}
