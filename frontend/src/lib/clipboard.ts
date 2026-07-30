/**
 * navigator.clipboard.writeText can silently reject in more situations than
 * people expect — most commonly "Document is not focused" if the click that
 * triggered it happened right after the window regained focus, or if the
 * Clipboard API simply isn't available in the current context. This wraps
 * it with a legacy execCommand fallback and always resolves to a clear
 * true/false so callers can show real feedback instead of nothing happening.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
