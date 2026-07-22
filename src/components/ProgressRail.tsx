import { useEffect, useRef } from 'react';

interface ProgressRailProps {
  readonly activeIndex: number;
  readonly count: number;
  readonly onSelect: (index: number) => void;
}

export function ProgressRail({ activeIndex, count, onSelect }: ProgressRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const activeButton = rail?.querySelector<HTMLButtonElement>('[aria-current="step"]');

    if (!rail || !activeButton || rail.scrollWidth <= rail.clientWidth) return;

    const left = activeButton.offsetLeft - rail.clientWidth / 2 + activeButton.offsetWidth / 2;
    rail.scrollTo({ left, behavior: 'auto' });
  }, [activeIndex]);

  return (
    <nav className="progress-rail" aria-label="语录位置">
      <div className="progress-rail__scroller" ref={railRef}>
        <div className="progress-rail__points">
          {Array.from({ length: count }, (_, index) => {
            const id = String(index + 1).padStart(2, '0');
            const isActive = index === activeIndex;
            const isEndpoint = index === 0 || index === count - 1;

            return (
              <button
                className="progress-point pressable"
                type="button"
                key={id}
                aria-label={`前往第 ${id} 条语录`}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onSelect(index)}
              >
                {isActive && <span className="progress-point__marker">{id}</span>}
                <span className="progress-point__tick" aria-hidden="true" />
                {isEndpoint && <span className="progress-point__endpoint">{id}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
