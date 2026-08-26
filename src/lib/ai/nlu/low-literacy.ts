export class LowLiteracyHandler {
  /**
   * Resolves simple 1-2 word replies based on conversation context
   * Examples: "haan", "nahi", "4", "6", "kal", "shaam", "sharma", "appointment"
   */
  public static resolveContextualInput(
    input: string,
    contextData: Record<string, any>
  ): { resolvedAction?: string; selectedValue?: any; isShortReply: boolean } {
    const cleaned = input.trim().toLowerCase();
    const isOneWord = cleaned.split(/\s+/).length <= 2;

    // Affirmations ("haan", "yes", "ha", "thik hai", "ok", "confirm", "1")
    if (['haan', 'ha', 'haa', 'yes', 'y', 'ok', 'okay', 'theek hai', 'thik hai', 'confirm', '1'].includes(cleaned)) {
      if (contextData.step === 'AWAITING_CONFIRMATION') {
        return { resolvedAction: 'CONFIRM_ACTION', isShortReply: true };
      }
      return { resolvedAction: 'AFFIRMATIVE', isShortReply: true };
    }

    // Negations ("nahi", "no", "na", "cancel", "change", "2")
    if (['nahi', 'nahin', 'no', 'n', 'na', 'change', 'badalna', '2'].includes(cleaned)) {
      if (contextData.step === 'AWAITING_CONFIRMATION') {
        return { resolvedAction: 'MODIFY_OR_CANCEL', isShortReply: true };
      }
      return { resolvedAction: 'NEGATIVE', isShortReply: true };
    }

    // Numeric slot selection: e.g. "1", "2", "3", "4", "5", "6"
    if (/^\d{1,2}$/.test(cleaned)) {
      const num = parseInt(cleaned, 10);
      return {
        resolvedAction: 'NUMERIC_SELECTION',
        selectedValue: num,
        isShortReply: true
      };
    }

    return { isShortReply: isOneWord };
  }
}
