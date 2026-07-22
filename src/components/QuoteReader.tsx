import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';

import { QUOTES } from '../data/quotes';
import {
  formatQuoteIndex,
  moveQuoteIndex,
  parseQuoteHash,
  quoteHash,
} from '../lib/quoteNavigation';
import { ArrowButton } from './ArrowButton';
import { ProgressRail } from './ProgressRail';
import { QuoteSlide } from './QuoteSlide';

interface PointerState {
  id: number;
  startX: number;
  startScrollLeft: number;
  lastX: number;
  lastTime: number;
  velocity: number;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function canConsumeVerticalWheel(target: EventTarget | null, deltaY: number): boolean {
  if (!(target instanceof Element)) return false;
  const scrollRegion = target.closest<HTMLElement>('.quote-scroll');
  if (!scrollRegion || scrollRegion.scrollHeight <= scrollRegion.clientHeight) return false;

  const atTop = scrollRegion.scrollTop <= 0;
  const atBottom = scrollRegion.scrollTop + scrollRegion.clientHeight >= scrollRegion.scrollHeight - 1;
  return deltaY < 0 ? !atTop : !atBottom;
}

export function QuoteReader() {
  const total = QUOTES.length;
  const [activeIndex, setActiveIndex] = useState(() => parseQuoteHash(window.location.hash, total));
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const wheelTimerRef = useRef<number | undefined>(undefined);
  const reducedMotion = useReducedMotion();

  const commitIndex = useCallback(
    (index: number) => {
      const nextIndex = moveQuoteIndex(index, 0, total);
      setActiveIndex(nextIndex);
      const nextHash = quoteHash(nextIndex);
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
      return nextIndex;
    },
    [total],
  );

  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = commitIndex(index);
      const track = trackRef.current;
      if (!track) return;

      track.scrollTo({
        left: nextIndex * track.clientWidth,
        behavior: reducedMotion ? 'auto' : behavior,
      });
    },
    [commitIndex, reducedMotion],
  );

  useEffect(() => {
    const initialIndex = parseQuoteHash(window.location.hash, total);
    commitIndex(initialIndex);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: initialIndex * track.clientWidth, behavior: 'auto' });
  }, [commitIndex, total]);

  useEffect(() => {
    const handleResize = () => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({ left: activeIndex * track.clientWidth, behavior: 'auto' });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  useEffect(() => {
    const handleHashChange = () => goTo(parseQuoteHash(window.location.hash, total), 'auto');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [goTo, total]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      let targetIndex: number | undefined;
      if (event.key === 'ArrowLeft') targetIndex = activeIndex - 1;
      if (event.key === 'ArrowRight') targetIndex = activeIndex + 1;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = total - 1;

      if (targetIndex === undefined) return;
      event.preventDefault();
      goTo(targetIndex, 'auto');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, goTo, total]);

  useEffect(
    () => () => {
      if (wheelTimerRef.current !== undefined) window.clearTimeout(wheelTimerRef.current);
    },
    [],
  );

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    commitIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const handleWheel = (event: ReactWheelEvent<HTMLElement>) => {
    if (
      isEditableTarget(event.target) ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      canConsumeVerticalWheel(event.target, event.deltaY)
    ) {
      return;
    }

    event.preventDefault();
    if (wheelLockedRef.current) return;
    wheelDeltaRef.current += event.deltaY;

    if (Math.abs(wheelDeltaRef.current) < 72) return;

    const direction = wheelDeltaRef.current > 0 ? 1 : -1;
    wheelDeltaRef.current = 0;
    wheelLockedRef.current = true;
    goTo(activeIndex + direction);

    wheelTimerRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false;
    }, 240);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || (event.pointerType === 'mouse' && event.button !== 0)) return;

    const track = trackRef.current;
    if (!track) return;

    track.setPointerCapture(event.pointerId);
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    const track = trackRef.current;
    if (!pointer || !track || pointer.id !== event.pointerId) return;

    const elapsed = Math.max(1, event.timeStamp - pointer.lastTime);
    pointer.velocity = (event.clientX - pointer.lastX) / elapsed;
    pointer.lastX = event.clientX;
    pointer.lastTime = event.timeStamp;
    track.scrollLeft = pointer.startScrollLeft - (event.clientX - pointer.startX);
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    const track = trackRef.current;
    if (!pointer || !track || pointer.id !== event.pointerId) return;

    const projectedLeft = track.scrollLeft - pointer.velocity * 180;
    const targetIndex = Math.round(projectedLeft / Math.max(1, track.clientWidth));
    pointerRef.current = null;
    setIsDragging(false);
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    goTo(targetIndex);
  };

  const handleStageKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && event.currentTarget === event.target) {
      event.currentTarget.querySelector<HTMLElement>('.quote-scroll')?.focus();
    }
  };

  const previousQuote = activeIndex > 0 ? QUOTES[activeIndex - 1] : null;
  const nextQuote = activeIndex < total - 1 ? QUOTES[activeIndex + 1] : null;

  return (
    <main className="quote-reader" onWheel={handleWheel}>
      <header className="masthead">
        <h1>长者同志经典语录</h1>
        <p className="counter" aria-label={`第 ${activeIndex + 1} 条，共 ${total} 条`}>
          {formatQuoteIndex(activeIndex, total)}
        </p>
      </header>

      <section
        className="quote-stage"
        aria-label="语录阅读器"
        onKeyDown={handleStageKeyDown}
      >
        <div
          className="edge-preview edge-preview--previous"
          data-empty={!previousQuote || undefined}
          aria-hidden="true"
        >
          <span>{previousQuote?.paragraphs[0]}</span>
        </div>
        <div
          className="edge-preview edge-preview--next"
          data-empty={!nextQuote || undefined}
          aria-hidden="true"
        >
          <span>{nextQuote?.paragraphs[0]}</span>
        </div>

        <div
          className="quote-track"
          data-dragging={isDragging || undefined}
          ref={trackRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
        >
          {QUOTES.map((quote, index) => (
            <QuoteSlide key={quote.id} quote={quote} active={index === activeIndex} />
          ))}
        </div>

        <ArrowButton
          direction="previous"
          disabled={activeIndex === 0}
          onClick={() => goTo(activeIndex - 1)}
        />
        <ArrowButton
          direction="next"
          disabled={activeIndex === total - 1}
          onClick={() => goTo(activeIndex + 1)}
        />
      </section>

      <footer className="reader-footer">
        <div className="swipe-hint" aria-hidden="true">
          <svg viewBox="0 0 40 18">
            <path d="M1 9h38M1 9l5-5M1 9l5 5M39 9l-5-5M39 9l-5 5" />
          </svg>
          <span>拖动浏览</span>
        </div>
        <ProgressRail activeIndex={activeIndex} count={total} onSelect={(index) => goTo(index)} />
      </footer>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        已显示第 {activeIndex + 1} 条语录，共 {total} 条
      </p>
    </main>
  );
}
