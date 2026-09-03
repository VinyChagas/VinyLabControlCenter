import { AudioLines, Hexagon } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { cn, formatVariation } from '@/utils/format';
import type { AccentColor } from '@/types';
import type { ReactNode } from 'react';

export interface ApiUsageItemProps {
  provider: string;
  amount: string;
  variation: number;
  used: string;
  limit: string;
  percentage: number;
  unit: string;
  accentColor: AccentColor;
}

function ProviderIcon({ provider, accentColor }: { provider: string; accentColor: AccentColor }) {
  const className = cn(
    'flex size-8 items-center justify-center rounded-lg transition-transform duration-200 hover:scale-110',
    accentColor === 'orange' ? 'bg-orange-accent/10 text-orange-accent' : 'bg-blue-accent/10 text-blue-accent',
  );

  let icon: ReactNode = <Hexagon className="size-4" strokeWidth={1.75} />;
  if (provider === 'ElevenLabs') {
    icon = <AudioLines className="size-4" strokeWidth={1.75} />;
  }

  return <span className={className}>{icon}</span>;
}

export function ApiUsageItem({
  provider,
  amount,
  variation,
  used,
  limit,
  percentage,
  unit,
  accentColor,
}: ApiUsageItemProps) {
  return (
    <article className="animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={provider} accentColor={accentColor} />
          <div>
            <p className="text-[13px] font-medium text-text">{provider}</p>
            <p className="text-[18px] font-semibold tracking-tight text-text">{amount}</p>
          </div>
        </div>
        <p
          className={cn(
            'text-[12px] font-medium',
            variation >= 0 ? 'text-blue-accent' : 'text-red-400',
          )}
        >
          {formatVariation(variation)}
        </p>
      </div>
      <p className="mt-1 text-right text-[11px] text-muted">vs mês anterior</p>
      <p className="mt-3 text-[12px] text-muted">
        {used} / {limit} {unit}
      </p>
      <Progress
        className="mt-2"
        value={percentage}
        accent={accentColor}
        ariaLabel={`Uso de ${provider}: ${percentage}%`}
      />
    </article>
  );
}
