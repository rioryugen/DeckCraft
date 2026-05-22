// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

export function memorySnapshotMb(): Record<string, number> {
  const usage = process.memoryUsage();
  return {
    rss_mb: Math.round(usage.rss / 1024 / 1024),
    heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
    external_mb: Math.round(usage.external / 1024 / 1024),
    array_buffers_mb: Math.round(usage.arrayBuffers / 1024 / 1024),
  };
}

export class BoundedTextBuffer {
  private text = "";
  private truncatedChars = 0;

  constructor(private readonly limit = 8192) {}

  append(value: Buffer | string): void {
    const next = Buffer.isBuffer(value) ? value.toString("utf8") : value;
    if (this.limit <= 0) {
      this.truncatedChars += next.length;
      return;
    }
    let combined = this.text + next;
    if (combined.length > this.limit) {
      const overflow = combined.length - this.limit;
      this.truncatedChars += overflow;
      combined = combined.slice(overflow);
    }
    this.text = combined;
  }

  toString(): string {
    const body = this.text.trim();
    if (!this.truncatedChars) return body;
    return `... [truncated ${this.truncatedChars} chars]\n${body}`.trim();
  }
}
