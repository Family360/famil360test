export function getAutonym(code: string, fallbackEnName: string): string {
  try {
    // Prefer the language's own locale to get its autonym
    const dn = (Intl as any)?.DisplayNames ? new (Intl as any).DisplayNames([code], { type: 'language' }) : null;
    const name = dn?.of?.(code);
    if (typeof name === 'string' && name.trim().length > 0) return name;
  } catch {}
  // Fallback to English name provided in SUPPORTED_LANGUAGES
  return fallbackEnName;
}
