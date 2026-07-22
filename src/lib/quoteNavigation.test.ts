import { describe, expect, it } from 'vitest';

import {
  formatQuoteIndex,
  moveQuoteIndex,
  parseQuoteHash,
  quoteHash,
} from './quoteNavigation';

describe('parseQuoteHash', () => {
  it('returns the zero-based index for a valid public hash', () => {
    expect(parseQuoteHash('#quote-02', 18)).toBe(1);
    expect(parseQuoteHash('#quote-18', 18)).toBe(17);
  });

  it('falls back to the first quote for missing, malformed, or out-of-range hashes', () => {
    expect(parseQuoteHash('', 18)).toBe(0);
    expect(parseQuoteHash('#quote-00', 18)).toBe(0);
    expect(parseQuoteHash('#quote-19', 18)).toBe(0);
    expect(parseQuoteHash('#other', 18)).toBe(0);
  });
});

describe('moveQuoteIndex', () => {
  it('moves within bounds and clamps at each end', () => {
    expect(moveQuoteIndex(4, 1, 18)).toBe(5);
    expect(moveQuoteIndex(4, -1, 18)).toBe(3);
    expect(moveQuoteIndex(0, -1, 18)).toBe(0);
    expect(moveQuoteIndex(17, 1, 18)).toBe(17);
  });
});

describe('public index formatting', () => {
  it('pads counters and hashes to two digits', () => {
    expect(formatQuoteIndex(1, 18)).toBe('02 / 18');
    expect(quoteHash(1)).toBe('#quote-02');
  });
});
