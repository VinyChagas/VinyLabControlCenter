import { cn } from '@/utils/format';
import type { ServiceStatus } from '@/types';

interface BadgeProps {
  status: ServiceStatus;
  label: string;
}

const STATUS_DOT: Record<ServiceStatus, string> = {
  online: 'bg-blue-accent',
  offline: 'bg-red-500',
  degraded: 'bg-orange-accent',
};

export function Badge({ status, label }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-muted">
      <span
        className={cn(
          'size-1.5 rounded-full animate-glow-pulse',
          STATUS_DOT[status],
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
