interface ArrowButtonProps {
  readonly direction: 'previous' | 'next';
  readonly disabled: boolean;
  readonly onClick: () => void;
}

export function ArrowButton({ direction, disabled, onClick }: ArrowButtonProps) {
  const isPrevious = direction === 'previous';
  const label = isPrevious ? '上一条语录' : '下一条语录';

  return (
    <button
      className={`arrow-button arrow-button--${direction} pressable`}
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d={isPrevious ? 'M20.5 6 10.5 16l10 10' : 'm11.5 6 10 10-10 10'} />
      </svg>
    </button>
  );
}
