// U+1F3F4 BLACK FLAG — prefix of every subdivision tag sequence
const BLACK_FLAG_CP = 0x1f3f4;

// Maps decoded tag-character strings to FlagCDN subdivision codes
const SUBDIVISION_CODES: Record<string, string> = {
  gbeng: 'gb-eng',
  gbsct: 'gb-sct',
  gbwls: 'gb-wls',
};

/**
 * Converts a flag emoji to a FlagCDN image URL.
 * Returns '' when the emoji cannot be resolved so callers render a text fallback.
 */
export function getFlagUrl(flagEmoji: string): string {
  if (!flagEmoji) return '';

  try {
    const chars = [...flagEmoji];
    const cp0 = chars[0]?.codePointAt(0) ?? 0;

    // Subdivision flags: U+1F3F4 followed by tag characters (U+E0000–U+E007F)
    if (cp0 === BLACK_FLAG_CP) {
      let tagStr = '';
      for (let i = 1; i < chars.length; i++) {
        const cp = chars[i].codePointAt(0) ?? 0;
        // Tag letters are U+E0061–U+E007A; U+E007F is the cancel tag (stop)
        if (cp >= 0xe0061 && cp <= 0xe007a) {
          tagStr += String.fromCharCode(cp - 0xe0000);
        } else if (cp === 0xe007f) {
          break;
        }
      }
      const code = SUBDIVISION_CODES[tagStr];
      return code ? `https://flagcdn.com/w40/${code}.png` : '';
    }

    // Standard ISO 3166-1 alpha-2 flags (two regional indicator characters)
    if (chars.length >= 2) {
      const cp1 = chars[1]?.codePointAt(0) ?? 0;
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
