import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuoteReader } from './QuoteReader';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe('QuoteReader', () => {
  it('starts with the first quotation as the only active item', () => {
    render(<QuoteReader />);

    expect(screen.getByRole('heading', { name: '长者同志经典语录' })).toBeVisible();
    expect(screen.getByText('01 / 18')).toBeVisible();
    expect(screen.getByLabelText('语录 01')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByLabelText('语录 02')).toHaveAttribute('aria-hidden', 'true');
  });

  it('moves to the next quotation and updates the public hash', () => {
    render(<QuoteReader />);

    fireEvent.click(screen.getByRole('button', { name: '下一条语录' }));

    expect(screen.getByText('02 / 18')).toBeVisible();
    expect(window.location.hash).toBe('#quote-02');
    expect(screen.getByLabelText('语录 02')).toHaveAttribute('aria-hidden', 'false');
  });

  it('supports immediate keyboard navigation and collection boundaries', () => {
    render(<QuoteReader />);

    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByText('18 / 18')).toBeVisible();
    expect(screen.getByRole('button', { name: '下一条语录' })).toBeDisabled();

    fireEvent.keyDown(window, { key: 'Home' });
    expect(screen.getByText('01 / 18')).toBeVisible();
    expect(screen.getByRole('button', { name: '上一条语录' })).toBeDisabled();
  });

  it('honors a valid quote hash on first render', () => {
    window.history.replaceState(null, '', '/#quote-16');
    render(<QuoteReader />);

    expect(screen.getByText('16 / 18')).toBeVisible();
    expect(screen.getByText(/ありがとうございました/)).toBeVisible();
  });
});
