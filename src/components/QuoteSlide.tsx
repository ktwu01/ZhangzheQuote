import type { Quote } from '../data/quotes';

interface QuoteSlideProps {
  readonly quote: Quote;
  readonly active: boolean;
}

export function QuoteSlide({ quote, active }: QuoteSlideProps) {
  return (
    <article
      className="quote-slide"
      id={`quote-${quote.id}`}
      data-length={quote.length}
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
