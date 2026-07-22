function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseQuoteHash(hash: string, total: number): number {
  const match = /^#quote-(\d{2})$/.exec(hash);
  const publicIndex = match ? Number(match[1]) : 1;

  return publicIndex >= 1 && publicIndex <= total ? publicIndex - 1 : 0;
}

export function moveQuoteIndex(index: number, delta: number, total: number): number {
  return Math.min(total - 1, Math.max(0, index + delta));
}

export function formatQuoteIndex(index: number, total: number): string {
  return `${pad(index + 1)} / ${pad(total)}`;
}

export function quoteHash(index: number): string {
  return `#quote-${pad(index + 1)}`;
}
