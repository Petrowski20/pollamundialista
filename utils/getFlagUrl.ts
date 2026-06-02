// Subdivision flag sequences (not decodable from regional indicators)
const SUBDIVISION_MAP: Record<string, string> = {
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'gb-eng',
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'gb-sct',
  '🏴󠁧󠁢󠁷󠁬󠁳󠁿': 'gb-wls',
};

// U+1F3F4 BLACK FLAG — prefix of every subdivision sequence
const BLACK_FLAG_CP = 0x1f3f4;

/**
 * Converts a flag emoji to a FlagCDN image URL.
 * Returns '' when the emoji cannot be resolved so callers render text fallback.
 */
export function getFlagUrl(flagEmoji: string): string {
  if (!flagEmoji) return '';

  try {
    // 1. Known subdivision flags (England, Scotland, Wales)
    if (SUBDIVISION_MAP[flagEmoji]) {
      return `https://flagcdn.com/w40/${SUBDIVISION_MAP[flagEmoji]}.png`;
    }

    const chars = [...flagEmoji];

    // 2. Any other black-flag sequence we don't recognise → text fallback
    if (chars[0]?.codePointAt(0) === BLACK_FLAG_CP) return '';

    // 3. Standard ISO 3166-1 alpha-2 flags (two regional indicator characters)
    if (chars.length === 2) {
      const cp0 = chars[0].codePointAt(0) ?? 0;
      const cp1 = chars[1].codePointAt(0) ?? 0;
      if (
        cp0 >= 0x1f1e6 && cp0 <= 0x1f1ff &&
        cp1 >= 0x1f1e6 && cp1 <= 0x1f1ff
      ) {
        const code = String.fromCharCode(
          cp0 - 0x1f1e6 + 65,
          cp1 - 0x1f1e6 + 65,
        ).toLowerCase();
        return `https://flagcdn.com/w40/${code}.png`;
      }
    }
  } catch {
    // Malformed emoji — caller renders text fallback
  }

  return '';
}
