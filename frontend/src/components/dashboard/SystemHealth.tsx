import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';
import type { SystemHealthData } from '@/types';

interface SystemHealthProps {
  health: SystemHealthData;
}

export function SystemHealth({ health }: SystemHealthProps) {
  return (
    <Card className="px-3 py-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-text">
            <span className="size-1.5 rounded-full bg-blue-accent animate-glow-pulse" aria-hidden />
            {health.statusLabel}
          </p>
          <p className="mt-1 text-[11px] text-muted">{health.detail}</p>
        </div>
        <p className="text-sm font-semibold text-text">{health.percentage}%</p>
      </div>
      <p className="mt-2 text-[11px] text-muted">{health.incidentsLabel}</p>
      <div className="mt-2">
        <Sparkline data={health.sparkline} accent="blue" className="h-6" />
      </div>
    </Card>
  );
}
