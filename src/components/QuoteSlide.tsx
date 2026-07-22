import type { CSSProperties } from 'react';

import { getQuoteScale, type Quote } from '../data/quotes';

interface QuoteSlideProps {
  readonly quote: Quote;
  readonly active: boolean;
}

export function QuoteSlide({ quote, active }: QuoteSlideProps) {
  const scale = getQuoteScale(quote.paragraphs.join(''));
  const typeStyle = {
    '--quote-font-min': `${Math.max(0.98, 2.9 * scale).toFixed(3)}rem`,
    '--quote-font-fluid': `${(5.6 * scale).toFixed(3)}vw`,
    '--quote-font-max': `${Math.max(1.18, 6 * scale).toFixed(3)}rem`,
    '--quote-mobile-font-min': `${Math.max(0.92, 2 * scale).toFixed(3)}rem`,
    '--quote-mobile-font-fluid': `${(10.2 * scale).toFixed(3)}vw`,
    '--quote-mobile-font-max': `${Math.max(1.05, 3.25 * scale).toFixed(3)}rem`,
  } as CSSProperties;

  return (
    <article
      className="quote-slide"
      id={`quote-${quote.id}`}
      data-length={quote.length}
      data-scale={scale}
      style={typeStyle}
      aria-label={`语录 ${quote.id}`}
      aria-hidden={!active}
    >
      <div className="quote-content">
        <div
          className="quote-scroll"
          role={quote.length === 'long' ? 'region' : undefined}
          aria-label={quote.length === 'long' ? `第 ${quote.id} 条长语录全文` : undefined}
          tabIndex={quote.length === 'long' && active ? 0 : undefined}
        >
          <blockquote>
            {quote.paragraphs.map((paragraph, index) => (
              <p key={`${quote.id}-${index}`}>{paragraph}</p>
            ))}
          </blockquote>
        </div>
        <footer>{quote.source}</footer>
      </div>
    </article>
  );
}
