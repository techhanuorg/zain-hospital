class MessageDeduplicator {
  private processedIds: Map<string, number> = new Map();
  private TTL_MS = 300000; // 5 minutes

  public isDuplicate(messageId: string): boolean {
    if (!messageId) return false;
    const now = Date.now();
    const existing = this.processedIds.get(messageId);
    if (existing && now - existing < this.TTL_MS) {
      return true;
    }
    this.processedIds.set(messageId, now);
    this.cleanup(now);
    return false;
  }

  private cleanup(now: number) {
    if (this.processedIds.size > 5000) {
      for (const [id, timestamp] of this.processedIds.entries()) {
        if (now - timestamp > this.TTL_MS) {
          this.processedIds.delete(id);
        }
      }
    }
  }
}

export const messageDeduplicator = new MessageDeduplicator();
