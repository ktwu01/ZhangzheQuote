# ZhangzheQuote Horizontal Quote Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a responsive, one-quotation-at-a-time horizontal reader for the 18 supplied quotations.

**Architecture:** A React + Vite single-page application keeps the quotation corpus in an immutable typed module, isolates deterministic navigation/hash logic in a tested helper, and renders a native scroll-snap stage through focused components. CSS owns the visual system and responsive typography; React owns selected state, URL synchronization, input routing, and accessible announcements.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest, Testing Library, CSS scroll snap, Pointer Events, browser history/hash APIs.

## Global Constraints

- Exactly one quotation is readable in the viewport at a time; never render an all-quotes list or vertical feed.
- Preserve the supplied 18 quotation texts and attributions verbatim, including English and Japanese phrases.
- Match `design/quote-carousel-concept.png`: mineral-red field, near-black typography, square controls, clipped edge previews, top counter, and 18-position bottom rail.
- Gesture movement remains interruptible and uses native momentum; programmatic UI motion stays below 300 ms.
- Keyboard navigation has no decorative animation.
- Honor `prefers-reduced-motion`, `prefers-reduced-transparency`, keyboard focus, semantic landmarks, live announcements, and 44 px minimum targets.
- Do not use portraits, flags, emblems, card grids, badges, pills, search, long-page sections, or invented visible copy.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: build and test entry points.
- `src/data/quotes.ts`: the immutable canonical corpus and length classifier.
- `src/lib/quoteNavigation.ts`: hash parsing, clamped movement, and counter formatting.
- `src/lib/quoteNavigation.test.ts`, `src/data/quotes.test.ts`: deterministic unit coverage.
- `src/components/ArrowButton.tsx`: previous/next SVG controls.
- `src/components/ProgressRail.tsx`: 18 navigable positions.
- `src/components/QuoteSlide.tsx`: one length-aware quote surface.
- `src/components/QuoteReader.tsx`: carousel state, hash synchronization, scroll selection, wheel and keyboard routing.
- `src/styles.css`: tokens, stage layout, responsive rules, focus/press states, and accessibility media queries.
- `src/main.tsx`: application mount.
- `README.md`: local development, test, build, and interaction documentation.

### Task 1: Scaffold the typed application and canonical content

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/data/quotes.ts`
- Test: `src/data/quotes.test.ts`

**Interfaces:**
- Produces: `Quote`, `QuoteLength`, `QUOTES`, and `getQuoteLength(text: string): QuoteLength`.
- Consumes: the 18 quotation bodies and sources supplied in the request.

- [ ] **Step 1: Create the Vite/TypeScript configuration and test scripts**

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": { "@vitejs/plugin-react": "latest", "vite": "latest", "typescript": "latest", "react": "latest", "react-dom": "latest" },
  "devDependencies": { "@testing-library/react": "latest", "@types/react": "latest", "@types/react-dom": "latest", "jsdom": "latest", "vitest": "latest" }
}
```

- [ ] **Step 2: Write the corpus contract test**

```ts
import { describe, expect, it } from 'vitest';
import { QUOTES } from './quotes';

describe('QUOTES', () => {
  it('contains the ordered 18-item source corpus', () => {
    expect(QUOTES).toHaveLength(18);
    expect(QUOTES.map(({ id }) => id)).toEqual(
      Array.from({ length: 18 }, (_, index) => String(index + 1).padStart(2, '0')),
    );
    expect(QUOTES.every(({ paragraphs, source }) => paragraphs.join('').trim() && source.trim())).toBe(true);
    expect(QUOTES[0].paragraphs.join('')).toContain('苟利国家生死已，岂因祸福避趋之');
    expect(QUOTES[1].paragraphs.join('')).toContain('too simple ， sometimes naive');
    expect(QUOTES[15].paragraphs.join('')).toContain('ありがとうございました');
  });
});
```

- [ ] **Step 3: Run the test and confirm the missing-module failure**

Run: `npm install && npm test -- src/data/quotes.test.ts`

Expected: FAIL because `./quotes` does not exist.

- [ ] **Step 4: Implement the immutable corpus**

```ts
export type QuoteLength = 'short' | 'medium' | 'long';

export interface Quote {
  readonly id: string;
  readonly paragraphs: readonly string[];
  readonly source: string;
  readonly length: QuoteLength;
}

export function getQuoteLength(text: string): QuoteLength {
  if (text.length > 260) return 'long';
  if (text.length > 110) return 'medium';
  return 'short';
}

const makeQuote = (id: string, paragraphs: readonly string[], source: string): Quote =>
  Object.freeze({ id, paragraphs, source, length: getQuoteLength(paragraphs.join('')) });
```

In the same module, export `QUOTES` as a frozen array of `makeQuote` calls. The array contains all 18 complete entries from the request in numeric order; the literal strings use the supplied paragraph breaks, punctuation, English phrases, Japanese phrase, and attributions without omission or paraphrase. The corpus contract test is the rejection gate for missed or reordered entries.

- [ ] **Step 5: Run the corpus test**

Run: `npm test -- src/data/quotes.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/data/quotes.ts src/data/quotes.test.ts
git commit -m "feat: add typed quotation corpus"
```

### Task 2: Implement deterministic navigation

**Files:**
- Create: `src/lib/quoteNavigation.ts`
- Test: `src/lib/quoteNavigation.test.ts`

**Interfaces:**
- Produces: `parseQuoteHash(hash, total)`, `moveQuoteIndex(index, delta, total)`, `formatQuoteIndex(index, total)`, and `quoteHash(index)`.
- Consumes: zero-based indices and the corpus length.

- [ ] **Step 1: Write navigation tests**

```ts
import { describe, expect, it } from 'vitest';
import { formatQuoteIndex, moveQuoteIndex, parseQuoteHash, quoteHash } from './quoteNavigation';

describe('quote navigation', () => {
  it('parses only in-range quote hashes', () => {
    expect(parseQuoteHash('#quote-02', 18)).toBe(1);
    expect(parseQuoteHash('#quote-00', 18)).toBe(0);
    expect(parseQuoteHash('#quote-19', 18)).toBe(0);
    expect(parseQuoteHash('#other', 18)).toBe(0);
  });
  it('clamps movement and formats public values', () => {
    expect(moveQuoteIndex(0, -1, 18)).toBe(0);
    expect(moveQuoteIndex(17, 1, 18)).toBe(17);
    expect(formatQuoteIndex(1, 18)).toBe('02 / 18');
    expect(quoteHash(1)).toBe('#quote-02');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- src/lib/quoteNavigation.test.ts`

Expected: FAIL because `quoteNavigation.ts` does not exist.

- [ ] **Step 3: Implement the helper**

```ts
const pad = (value: number) => String(value).padStart(2, '0');

export function parseQuoteHash(hash: string, total: number): number {
  const match = /^#quote-(\d{2})$/.exec(hash);
  const publicIndex = match ? Number(match[1]) : 1;
  return publicIndex >= 1 && publicIndex <= total ? publicIndex - 1 : 0;
}

export function moveQuoteIndex(index: number, delta: number, total: number): number {
  return Math.min(total - 1, Math.max(0, index + delta));
}

export const formatQuoteIndex = (index: number, total: number) => `${pad(index + 1)} / ${pad(total)}`;
export const quoteHash = (index: number) => `#quote-${pad(index + 1)}`;
```

- [ ] **Step 4: Run the tests and commit**

Run: `npm test`

Expected: PASS, all tests.

```bash
git add src/lib/quoteNavigation.ts src/lib/quoteNavigation.test.ts
git commit -m "feat: add quote navigation model"
```

### Task 3: Build the one-quote reader

**Files:**
- Create: `src/main.tsx`
- Create: `src/components/ArrowButton.tsx`
- Create: `src/components/ProgressRail.tsx`
- Create: `src/components/QuoteSlide.tsx`
- Create: `src/components/QuoteReader.tsx`
- Create: `src/styles.css`

**Interfaces:**
- `ArrowButton({ direction, disabled, onClick })` emits one clamped navigation request.
- `ProgressRail({ activeIndex, count, onSelect })` emits a target index.
- `QuoteSlide({ quote, index })` renders a semantic blockquote and attribution.
- `QuoteReader()` composes the app and owns the active index.

- [ ] **Step 1: Build semantic rendering primitives**

```tsx
export function QuoteSlide({ quote, index }: { quote: Quote; index: number }) {
  return (
    <article className="quote-slide" data-length={quote.length} aria-label={`语录 ${quote.id}`}>
      <blockquote>
        {quote.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </blockquote>
      <footer>{quote.source}</footer>
    </article>
  );
}
```

Use inline SVG paths for the two arrows, `aria-label="上一条语录"` / `aria-label="下一条语录"`, and rail buttons labeled `前往第 NN 条语录`.

- [ ] **Step 2: Build the reader state and input flow**

In `QuoteReader`, initialize from `parseQuoteHash(location.hash, QUOTES.length)`, keep a ref to the horizontal `.quote-track`, and implement one `goTo(index, behavior)` function. `goTo` clamps the index, calls `scrollTo({ left: index * clientWidth, behavior })`, updates state immediately for instant keyboard navigation and after scroll settling for gestures, and replaces the hash with `history.replaceState`.

Attach these exact input mappings:

```ts
switch (event.key) {
  case 'ArrowLeft': goTo(activeIndex - 1, 'instant'); break;
  case 'ArrowRight': goTo(activeIndex + 1, 'instant'); break;
  case 'Home': goTo(0, 'instant'); break;
  case 'End': goTo(QUOTES.length - 1, 'instant'); break;
}
```

Use an `IntersectionObserver` with the track as root and threshold `0.65` to identify the active native-scroll slide. Accumulate wheel delta until `72` CSS pixels, then advance one item and reset; ignore wheel events while an editable element has focus.

- [ ] **Step 3: Implement the concept-locked CSS system**

```css
:root {
  color: #130d0b;
  background: #c72c1c;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --red: #c72c1c;
  --ink: #130d0b;
  --paper: #fff8ef;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

.quote-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.quote-slide {
  flex: 0 0 100%;
  min-width: 0;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.pressable { transition: transform 140ms var(--ease-out), opacity 140ms var(--ease-out); }
.pressable:active { transform: scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; }
}
```

The same file defines these explicit layout rules: the shell is `100dvh`; the masthead is fixed to `clamp(20px, 3vw, 48px)` top/side gutters; the stage occupies the space between the masthead and a 116 px desktop rail; the quote measure is `min(72vw, 1120px)`; `short`, `medium`, and `long` slides use separate `clamp()` font scales; edge previews are 4.25vw darkened strips; arrow buttons are 72 px square on desktop and 48 px square on mobile; the mobile control band starts below the source; `data-length="long"` gets a labelled internal overflow region; hover rules appear only inside `(hover: hover) and (pointer: fine)`; `:focus-visible` uses a 2 px warm-white outline; and reduced transparency replaces translucent surfaces with solid `#4d120d`.

- [ ] **Step 4: Mount the application and run quality checks**

Run: `npm test && npm run build`

Expected: all tests PASS and Vite build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/components src/styles.css
git commit -m "feat: build horizontal quote reader"
```

### Task 4: Verify behavior, fidelity, and first-time clarity

**Files:**
- Create: `README.md`
- Modify: UI files only when browser evidence exposes a mismatch.

**Interfaces:**
- Consumes: the built application and accepted concept.
- Produces: a documented, browser-verified build with no material mismatch.

- [ ] **Step 1: Document the project**

```md
# ZhangzheQuote

一屏一句、左右滑动的“长者同志经典语录”阅读器。

## Commands

- `npm run dev` — start the local site
- `npm test` — run unit tests
- `npm run build` — create the production build

## Controls

Drag or swipe, use the arrow buttons, scroll the wheel/trackpad, press ←/→/Home/End, or choose a position on the bottom rail.
```

- [ ] **Step 2: Run the local preview and browser workflow**

Run: `npm run dev -- --port 4173`

Verify quotation 01 loads; next arrow reaches 02; previous returns to 01; rail reaches 18; right arrow is disabled at 18; `#quote-16` deep-links correctly; keyboard navigation is immediate; long mobile entries scroll internally.

- [ ] **Step 3: Capture and compare**

Capture desktop at 1584 × 1024 and mobile at 390 × 844. Use `view_image` on `design/quote-carousel-concept.png` and the latest desktop capture in the same QA pass. Compare at least palette, masthead/counter, quote measure/type scale, edge previews/arrows, source placement, progress rail, mobile fit, and reduced-motion behavior. Fix every material mismatch and repeat the capture.

- [ ] **Step 4: Run the zero-context UX audit**

Confirm the top-level strings “长者同志经典语录”, `01 / 18`, the quotation, source, “拖动浏览”, and explicit control labels make the archive and next action clear. Check first/last disabled states, long-content state, JavaScript-disabled state, and invalid-hash fallback.

- [ ] **Step 5: Run the animation audit**

Reject `transition: all`, `ease-in`, `scale(0)`, ungated hover motion, layout-property animation, keyframes on gesture-driven elements, UI duration above 300 ms, and movement without reduced-motion handling.

- [ ] **Step 6: Final checks and commit**

Run: `npm test && npm run build && git status --short`

Expected: tests and build pass; only intentional files are staged or modified.

```bash
git add README.md src
git commit -m "docs: document and polish quote reader"
```
