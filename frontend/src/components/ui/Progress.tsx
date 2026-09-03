import { cn } from '@/utils/format';
import type { AccentColor } from '@/types';

interface ProgressProps {
  value: number;
  accent?: AccentColor;
  ariaLabel: string;
  className?: string;
  animated?: boolean;
}

export function Progress({ value, accent = 'blue', ariaLabel, className, animated = true }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        'h-1 w-full overflow-hidden rounded-full bg-white/5',
        animated && 'progress-animated',
        className,
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          accent === 'orange' ? 'bg-orange-accent' : 'bg-blue-accent',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
