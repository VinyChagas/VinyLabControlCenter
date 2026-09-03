import { Card } from '@/components/ui/Card';
import type { SystemInfoData } from '@/types';

interface SystemInfoProps {
  system: SystemInfoData;
}

export function SystemInfo({ system }: SystemInfoProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Hostname', value: system.hostname },
    { label: 'IP Principal', value: system.primaryIp },
    { label: 'SO', value: system.os },
    { label: 'Kernel', value: system.kernel },
    {
      label: 'Carga Média',
      value: system.loadAverage.map((n) => (n === null ? '--' : n.toFixed(2))).join('  '),
    },
    { label: 'Atualizado em', value: system.updatedAt },
  ];

  return (
    <Card accent="orange-tl" className="flex min-h-[320px] flex-col p-5 animate-slide-up stagger-7">
      <h2 className="text-[15px] font-semibold text-text">Informações do Sistema</h2>
      <dl className="mt-5 flex flex-1 flex-col justify-between gap-3">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3 animate-fade-in"
            style={{ animationDelay: `${0.4 + index * 0.06}s` }}
          >
            <dt className="text-[12px] text-muted">{row.label}</dt>
            <dd className="text-right text-[13px] font-medium text-text">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
