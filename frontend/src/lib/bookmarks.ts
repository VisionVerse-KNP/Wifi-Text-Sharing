const STORAGE_KEY = 'wts_bookmarked_messages';

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // storage unavailable (private browsing etc.) — bookmarks just won't persist
  }
}

export function getBookmarks(): Set<string> {
  return readSet();
}

export function isBookmarked(id: string): boolean {
  return readSet().has(id);
}

/** Toggles a bookmark and returns the new full set. */
export function toggleBookmark(id: string): Set<string> {
  const set = readSet();
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
  writeSet(set);
  return set;
}
