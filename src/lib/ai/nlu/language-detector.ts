import { SupportedLanguage } from '../../types';

export class LanguageDetector {
  public static detect(text: string): SupportedLanguage {
    if (!text) return 'en';
    const lower = text.toLowerCase();

    // 1. Script-based Unicode checks
    if (/[ऀ-ॿ]/.test(text)) {
      // Devanagari script: Marathi vs Hindi
      if (/(आहे|नाही|कधी|मला|डॉक्टरला|भेटायचे|वेळ|सकाळी|संध्याकाळी)/.test(text)) {
        return 'mr';
      }
      return 'hi';
    }

    if (/[઀-૿]/.test(text)) return 'gu'; // Gujarati
    if (/[ঀ-৿]/.test(text)) return 'bn'; // Bengali
    if (/[஀-௿]/.test(text)) return 'ta'; // Tamil
    if (/[ఀ-౿]/.test(text)) return 'te'; // Telugu
    if (/[ಀ-೿]/.test(text)) return 'kn'; // Kannada
    if (/[ഀ-ൿ]/.test(text)) return 'ml'; // Malayalam
    if (/[਀-੿]/.test(text)) return 'pa'; // Punjabi
    if (/[؀-ۿ]/.test(text)) return 'ur'; // Urdu

    // 2. Hinglish / Romanized Hindi keywords check
    const hinglishMarkers = [
      'mujhe', 'mera', 'meri', 'naam', 'umar', 'saal', 'hai', 'karna', 'karni',
      'dikhana', 'milna', 'chahiye', 'bhai', 'mummy', 'papa', 'batao', 'kitne',
      'baje', 'khulta', 'kaha', 'kahan', 'shaam', 'subah', 'dopahar', 'raat',
      'aaj', 'kal', 'parso', 'khatam', 'kripya', 'dhanyawad', 'haan', 'nahi',
      'zarurat', 'karo', 'karein', 'hoga', 'hogi', 'apna', 'apni', 'doctor ko'
    ];

    let matchCount = 0;
    const tokens = lower.split(/\s+/);
    for (const token of tokens) {
      if (hinglishMarkers.includes(token)) {
        matchCount++;
      }
    }

    if (matchCount >= 1 || tokens.some(t => hinglishMarkers.some(m => t.includes(m)))) {
      return 'hinglish';
    }

    return 'en';
  }
}
