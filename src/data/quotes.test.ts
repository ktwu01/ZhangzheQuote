import { describe, expect, it } from 'vitest';

import { QUOTES } from './quotes';

describe('QUOTES', () => {
  it('contains the ordered 18-item source corpus', () => {
    expect(QUOTES).toHaveLength(18);
    expect(QUOTES.map(({ id }) => id)).toEqual(
      Array.from({ length: 18 }, (_, index) => String(index + 1).padStart(2, '0')),
    );
  });

  it('keeps every quotation and attribution populated', () => {
    expect(
      QUOTES.every(({ paragraphs, source }) => paragraphs.join('').trim() && source.trim()),
    ).toBe(true);
  });

  it('preserves distinctive multilingual source phrases', () => {
    expect(QUOTES[0].paragraphs.join('')).toContain('苟利国家生死已，岂因祸福避趋之');
    expect(QUOTES[1].paragraphs.join('')).toContain('too simple ， sometimes naive');
    expect(QUOTES[15].paragraphs.join('')).toContain('ありがとうございました');
  });
});
