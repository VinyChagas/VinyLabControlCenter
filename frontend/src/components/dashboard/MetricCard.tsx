import {
  ArrowDownUp,
  Cpu,
  HardDrive,
  MemoryStick,
  Timer,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/utils/format';
import type { LucideIcon } from 'lucide-react';
import type { MetricCardData, MetricIcon } from '@/types';

const METRIC_ICONS: Record<MetricIcon, LucideIcon> = {
  cpu: Cpu,
  memory: MemoryStick,
  storage: HardDrive,
  network: ArrowDownUp,
  uptime: Timer,
};

interface MetricCardProps {
  metric: MetricCardData;
  index?: number;
}

export function MetricCard({ metric, index = 0 }: MetricCardProps) {
  const Icon = METRIC_ICONS[metric.icon];
  const isOrange = metric.accent === 'orange';

  return (
    <Card
      accent={isOrange ? 'orange' : 'none'}
      className={cn(
        'flex min-h-[118px] flex-col px-4 py-3.5 animate-slide-up group cursor-default',
        `stagger-${index + 1}`,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted">{metric.label}</p>
        <Icon
          className={cn(
            'size-4 transition-transform duration-300 group-hover:scale-110',
            isOrange ? 'text-orange-accent' : 'text-blue-accent',
          )}
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-2 text-[22px] leading-none font-semibold tracking-tight text-text">
        {metric.value}
      </p>
      <p className="mt-1.5 text-[12px] text-muted">{metric.secondary}</p>
      <div className="mt-auto pt-2">
        <Sparkline data={metric.sparkline} accent={metric.accent} />
      </div>
    </Card>
  );
}
