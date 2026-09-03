import { cn } from '@/utils/format';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: 'none' | 'orange' | 'orange-tl';
}

export function Card({ children, className, accent = 'none' }: CardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-line bg-card transition-all duration-300 hover:border-line/80 hover:shadow-[0_0_24px_-8px_rgb(22_139_255_/_0.06)]',
        accent === 'orange' && 'border-orange-accent/25 shadow-[0_-1px_0_0_rgb(255_121_0_/_0.45)] hover:shadow-[0_0_24px_-8px_rgb(255_121_0_/_0.1)]',
        className,
      )}
    >
      {accent === 'orange-tl' ? (
        <span
          className="pointer-events-none absolute left-0 top-0 h-px w-14 bg-orange-accent/80"
          aria-hidden
        />
      ) : null}
      {children}
    </section>
  );
}
