import { cn } from '@/utils/format';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-white/5', className)}
      aria-hidden
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-[118px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-[340px] rounded-xl lg:col-span-6" />
        <Skeleton className="h-[340px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-[340px] rounded-xl lg:col-span-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-[360px] rounded-xl lg:col-span-9" />
        <Skeleton className="h-[360px] rounded-xl lg:col-span-3" />
      </div>
    </div>
  );
}
