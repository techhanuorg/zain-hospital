export class DateTimeParser {
  /**
   * Parse date strings in Hindi / Hinglish / English / relative formats into YYYY-MM-DD
   */
  public static parseDate(text: string, referenceDate: Date = new Date()): string | null {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    const d = new Date(referenceDate);

    // Relative indicators
    if (lower.includes('aaj') || lower.includes('today')) {
      return this.formatYYYYMMDD(d);
    }

    if (lower.includes('kal') || lower.includes('tomorrow') || lower.includes('tomorow')) {
      d.setDate(d.getDate() + 1);
      return this.formatYYYYMMDD(d);
    }

    if (lower.includes('parso') || lower.includes('day after tomorrow')) {
      d.setDate(d.getDate() + 2);
      return this.formatYYYYMMDD(d);
    }

    // Next week / days
    if (lower.includes('somvar') || lower.includes('monday')) {
      return this.getNextDayOfWeek(1, referenceDate);
    }
    if (lower.includes('mangalvar') || lower.includes('tuesday')) {
      return this.getNextDayOfWeek(2, referenceDate);
    }
    if (lower.includes('budhvar') || lower.includes('wednesday')) {
      return this.getNextDayOfWeek(3, referenceDate);
    }
    if (lower.includes('guruvar') || lower.includes('thursday') || lower.includes('veerwar')) {
      return this.getNextDayOfWeek(4, referenceDate);
    }
    if (lower.includes('shukravar') || lower.includes('friday')) {
      return this.getNextDayOfWeek(5, referenceDate);
    }
    if (lower.includes('shanivar') || lower.includes('saturday')) {
      return this.getNextDayOfWeek(6, referenceDate);
    }
    if (lower.includes('ravivar') || lower.includes('sunday') || lower.includes('itwar')) {
      return this.getNextDayOfWeek(0, referenceDate);
    }

    // Direct DD/MM/YYYY or DD-MM-YYYY
    const matchSlash = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (matchSlash) {
      const day = matchSlash[1].padStart(2, '0');
      const month = matchSlash[2].padStart(2, '0');
      let year = matchSlash[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // Direct "27 august", "27 aug", "27 ko"
    const monthNames: Record<string, string> = {
      'jan': '01', 'january': '01', 'janvari': '01',
      'feb': '02', 'february': '02', 'farvari': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05', 'mai': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08', 'agast': '08',
      'sep': '09', 'september': '09', 'sitambar': '09',
      'oct': '10', 'october': '10', 'aktubar': '10',
      'nov': '11', 'november': '11', 'navambar': '11',
      'dec': '12', 'december': '12', 'disambar': '12'
    };

    const matchDateMonth = text.match(/(\d{1,2})\s*([a-zA-Z]+)/);
    if (matchDateMonth) {
      const day = matchDateMonth[1].padStart(2, '0');
      const monthStr = matchDateMonth[2].toLowerCase();
      for (const [mKey, mVal] of Object.entries(monthNames)) {
        if (monthStr.startsWith(mKey)) {
          const year = referenceDate.getFullYear();
          return `${year}-${mVal}-${day}`;
        }
      }
    }

    const matchDayOnly = text.match(/(\d{1,2})\s*(ko|tarikh|tareekh|th|st|nd|rd)/i);
    if (matchDayOnly) {
      const day = matchDayOnly[1].padStart(2, '0');
      const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
      const year = referenceDate.getFullYear();
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Parse time preference: e.g. "shaam", "10 baje", "das baje", "10:30", "saade das", "6 PM", "subah"
   */
  public static parseTime(text: string): { time?: string; period?: 'morning' | 'afternoon' | 'evening' | 'night' } {
    if (!text) return {};
    const lower = text.toLowerCase();

    // Periods
    let period: 'morning' | 'afternoon' | 'evening' | 'night' | undefined;
    if (lower.includes('shaam') || lower.includes('sham') || lower.includes('evening')) {
      period = 'evening';
    } else if (lower.includes('subah') || lower.includes('subh') || lower.includes('morning')) {
      period = 'morning';
    } else if (lower.includes('dopahar') || lower.includes('dophar') || lower.includes('afternoon') || lower.includes('noon')) {
      period = 'afternoon';
    } else if (lower.includes('raat') || lower.includes('night')) {
      period = 'night';
    }

    // Number word mappings (Hindi / English)
    const numWords: Record<string, number> = {
      'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhe': 6, 'che': 6, 'saat': 7,
      'aath': 8, 'nau': 9, 'das': 10, 'gyarah': 11, 'barah': 12,
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
      'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12
    };

    // Check for "saade das" (10:30), "dedh" (1:30), "dhai" (2:30), "sawa das" (10:15)
    let explicitHour: number | null = null;
    let explicitMinute: number = 0;

    if (lower.includes('saade') || lower.includes('sade')) {
      explicitMinute = 30;
      for (const [w, n] of Object.entries(numWords)) {
        if (lower.includes(w)) {
          explicitHour = n;
          break;
        }
      }
    } else if (lower.includes('dedh')) {
      explicitHour = 1;
      explicitMinute = 30;
    } else if (lower.includes('dhai')) {
      explicitHour = 2;
      explicitMinute = 30;
    }

    // Match numeric time e.g. "10:30", "6:00 pm", "10 baje", "6 baje"
    const matchTime = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|ke aas paas)?/);
    if (matchTime && !explicitHour) {
      let h = parseInt(matchTime[1], 10);
      const m = matchTime[2] ? parseInt(matchTime[2], 10) : 0;
      const meridiem = matchTime[3];

      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;

      // In Indian context, "6 baje" or "shaam 6" implies 18:00
      if ((meridiem === 'baje' || !meridiem) && (period === 'evening' || period === 'night') && h < 12) {
        h += 12;
      }
      if (h <= 23) {
        explicitHour = h;
        explicitMinute = m;
      }
    }

    if (explicitHour !== null) {
      const hourStr = String(explicitHour).padStart(2, '0');
      const minStr = String(explicitMinute).padStart(2, '0');
      return {
        time: `${hourStr}:${minStr}`,
        period: period || (explicitHour < 12 ? 'morning' : explicitHour < 16 ? 'afternoon' : 'evening')
      };
    }

    return { period };
  }

  private static formatYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static getNextDayOfWeek(targetDay: number, refDate: Date): string {
    const d = new Date(refDate);
    const currentDay = d.getDay();
    let distance = targetDay - currentDay;
    if (distance <= 0) distance += 7;
    d.setDate(d.getDate() + distance);
    return this.formatYYYYMMDD(d);
  }
}
