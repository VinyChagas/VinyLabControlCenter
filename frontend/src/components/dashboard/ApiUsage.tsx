import { ApiUsageItem } from '@/components/dashboard/ApiUsageItem';
import { Card } from '@/components/ui/Card';
import type { ApiUsageItemData } from '@/types';

interface ApiUsageProps {
  items: ApiUsageItemData[];
}

export function ApiUsage({ items }: ApiUsageProps) {
  return (
    <Card className="flex min-h-[340px] flex-col p-5 animate-slide-up stagger-7">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-text">Consumo de APIs</h2>
        <p className="mt-0.5 text-[12px] text-muted">Mês atual</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-8">
        {items.map((item) => (
          <ApiUsageItem
            key={item.id}
            provider={item.provider}
            amount={item.amount}
            variation={item.variation}
            used={item.used}
            limit={item.limit}
            percentage={item.percentage}
            unit={item.unit}
            accentColor={item.accentColor}
          />
        ))}
      </div>
    </Card>
  );
}
