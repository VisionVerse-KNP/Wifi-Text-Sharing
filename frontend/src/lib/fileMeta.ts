import { FileCategory } from '../types';

// Mirrors the server's allowlist closely enough to give instant feedback —
// the backend re-validates everything authoritatively, this is just UX.
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB, matches backend default

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.msp', '.scr', '.ps1', '.psm1',
  '.vbs', '.vbe', '.jar', '.app', '.apk', '.dll', '.sh', '.bin',
  '.deb', '.rpm', '.dmg', '.pkg', '.run', '.gadget', '.msc', '.cpl', '.reg',
  '.lnk', '.ws', '.wsf', '.wsh', '.hta', '.jse', '.scf', '.action', '.workflow',
]);

const CATEGORY_BY_EXTENSION: Record<string, FileCategory> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  svg: 'image', bmp: 'image', ico: 'image',
  mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video', ogv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
  pdf: 'pdf',
  doc: 'document', docx: 'document', odt: 'document', rtf: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', ods: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', odp: 'presentation',
  zip: 'archive', '7z': 'archive', rar: 'archive', gz: 'archive', tar: 'archive', tgz: 'archive',
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code', rb: 'code',
  java: 'code', c: 'code', cpp: 'code', go: 'code', rs: 'code', php: 'code', sql: 'code',
  txt: 'text', md: 'text', json: 'text', xml: 'text', html: 'text', css: 'text',
  yaml: 'text', yml: 'text', log: 'text',
};

const CATEGORY_ICON: Record<FileCategory, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  pdf: '📕',
  document: '📄',
  spreadsheet: '📊',
  presentation: '📽️',
  archive: '🗜️',
  code: '💻',
  text: '📃',
  other: '📎',
};

export function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

export function categorize(filename: string): FileCategory {
  const ext = extensionOf(filename).replace('.', '');
  return CATEGORY_BY_EXTENSION[ext] ?? 'other';
}

export function iconForCategory(category: FileCategory): string {
  return CATEGORY_ICON[category] ?? '📎';
}

export function isLikelyBlocked(filename: string): boolean {
  return BLOCKED_EXTENSIONS.has(extensionOf(filename));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}
