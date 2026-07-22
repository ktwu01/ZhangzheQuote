# ZhangzheQuote Horizontal Quote Reader — Design Specification

## Goal

Build a single-screen reading experience for the 18 supplied “长者同志经典语录”. The site reveals exactly one numbered quotation at a time. Visitors move left and right through the collection as if browsing a physical menu or record archive; the page must never become an all-quotes list or a long vertical feed.

## Accepted Direction

The implementation follows the single concept at [`design/quote-carousel-concept.png`](../../../design/quote-carousel-concept.png). The user requested one direction only and authorized full execution.

The visual language is a restrained Chinese modernist editorial archive:

- warm mineral red full-viewport field with subtle paper/ink texture;
- near-black Chinese display type as the primary visual asset;
- a quiet title at top left and current/total counter at top right;
- one centered quotation with its source directly beneath;
- narrow, clipped neighboring slides at the left and right edges as the sole preview of additional content;
- square previous/next controls aligned to those edge previews;
- a bottom rail with 18 positions, the active position made unambiguous;
- no portraits, emblems, flags, generic illustration, card grid, search, long page, badges, or decorative sections.

## Information Architecture

The application has one route and one primary surface.

1. Masthead: “长者同志经典语录” and the current index in `NN / 18` form.
2. Quote stage: the current quotation and source. Only the active quotation is readable. Adjacent slides are clipped by the viewport.
3. Navigation: previous/next buttons, drag/swipe gesture, mouse wheel, keyboard arrows, and an 18-position rail.
4. Assistive status: an off-screen live region announces the newly selected quotation number.

The URL hash records the selected item as `#quote-01` through `#quote-18`. Opening a valid hash selects that quotation. Invalid hashes fall back to item 01.

## Content Model

Each entry has four fields:

- `id`: two-digit identifier from `01` to `18`;
- `paragraphs`: the exact supplied quotation split only at meaningful paragraph boundaries;
- `source`: the exact supplied attribution without inventing facts;
- `length`: `short`, `medium`, or `long`, computed from character count and exposed as a styling hook.

The long first and second entries remain one item each. On compact screens, their quote body can scroll vertically inside the fixed stage while the overall application remains a one-quote horizontal reader.

## Interaction Design

### Direct manipulation

Touch and pointer dragging use the browser’s native horizontal scrolling and snap behavior so the slide stays under the pointer, retains platform momentum, remains interruptible, and can be reversed immediately. Slides snap to the nearest item. At the first and last entries the browser’s natural boundary behavior communicates that the collection has ended.

### Other input

- Previous/next buttons animate to the adjacent item.
- A mouse wheel or trackpad gesture advances only after a deliberate accumulated threshold and is throttled until the current snap settles.
- Clicking a rail position navigates to that entry.
- `ArrowLeft`, `ArrowRight`, `Home`, and `End` navigate without decorative animation, matching the motion guidance for high-frequency keyboard actions.
- Focus remains visible, button labels are explicit to assistive technology, and all tap targets are at least 44 CSS pixels.

### Motion

- Gesture motion is native, interruptible, and momentum-aware.
- Button and rail navigation use a strong ease-out scroll transition and only animate transform/opacity in UI chrome.
- Press feedback is immediate and subtle (`scale(0.97)`, 100–160 ms).
- Hover movement is gated behind fine-pointer media queries.
- `prefers-reduced-motion: reduce` removes spatial programmatic motion and uses immediate selection plus short opacity feedback.
- `prefers-reduced-transparency: reduce` removes any translucent control treatment.

## Responsive Behavior

Desktop uses an asymmetric, wide editorial composition with a maximum quote measure around 18–22 Chinese characters per line. Tablet tightens outer gutters and keeps both arrow controls visible. Mobile moves the arrows into the lower control band, reduces the chrome, and gives the quotation the maximum available width. Font size changes by both viewport and content length; body text never clips. The stage fills `100dvh` with a minimum-height fallback.

## Visual Tokens

- Background: mineral red sampled from the concept, approximately `#c72c1c`.
- Foreground: near-black `#130d0b`.
- Reversed control text: warm white `#fff8ef`.
- Subtle ink: foreground at 45–65% opacity.
- Display type: a high-contrast Chinese serif stack led by Songti/STSong; system CJK serif fallbacks follow.
- UI type: system sans-serif stack for counters, controls, and source metadata.
- Geometry: square controls, hairline rules, no rounded cards.
- Texture: CSS-only low-opacity grain/print variation; it must never reduce text contrast.

## Component Boundaries

- `quotes.ts` owns immutable source content and length classification.
- `quoteNavigation.ts` owns hash parsing, clamped index movement, and index formatting.
- `QuoteReader` owns selected state, URL synchronization, input dispatch, and live announcements.
- `QuoteSlide` renders one quotation and source with length-aware typography.
- `ProgressRail` renders the 18 navigable positions and the current marker.
- `ArrowButton` provides consistent SVG arrow geometry and accessible labels.

## Error and Edge Handling

- Invalid or missing hashes select quotation 01.
- The previous button is disabled at item 01 and the next button at item 18; disabled controls remain visible so layout does not jump.
- A quotation too tall for the available mobile stage gets an internal vertical scroll area with a visible edge fade and a screen-reader label.
- JavaScript-disabled visitors see the first quotation and a concise message that navigation requires JavaScript.
- No data is fetched, so there is no loading state or network error state.

## Testing and Acceptance

Automated tests cover the 18-entry data contract, ID ordering, hash parsing, clamped navigation, and index formatting. Browser verification covers:

- desktop at the concept’s native 1584 × 1024 dimensions;
- a small laptop viewport;
- mobile at 390 × 844;
- drag/swipe, arrows, wheel, keyboard, rail navigation, hash deep-linking, first/last boundaries, and reduced motion;
- long entries 01 and 02 for clipping and internal vertical scrolling;
- above-the-fold copy parity with the accepted concept and supplied content.

The final browser screenshot must be compared directly with the accepted concept. Palette, first-viewport composition, one-quote rule, quote typography, edge previews, controls, counter, and rail must match closely enough for agency sign-off.
