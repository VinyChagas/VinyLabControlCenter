import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { ROUTES } from '@/constants/navigation';
import type { ServiceItem, ServiceStatus } from '@/types';

const STATUS_LABEL: Record<ServiceStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  degraded: 'Degradado',
};

interface ServicesTableProps {
  services: ServiceItem[];
}

export function ServicesTable({ services }: ServicesTableProps) {
  return (
    <Card className="flex min-h-[320px] flex-col p-5 animate-slide-up stagger-6">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-text">Serviços</h2>
        <p className="mt-0.5 text-[12px] text-muted">Status dos principais serviços</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="text-[11px] tracking-wide text-muted uppercase">
              <th className="pb-3 font-medium">Serviço</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Uptime</th>
              <th className="pb-3 font-medium">CPU</th>
              <th className="pb-3 font-medium">Memória</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr
                key={service.id}
                className="border-t border-line/80 transition-colors duration-200 hover:bg-white/[0.02] animate-slide-up-sm"
                style={{ animationDelay: `${0.3 + index * 0.06}s` }}
              >
                <td className="py-3 pr-4">
                  <p className="text-[13px] font-medium text-text">{service.name}</p>
                  <p className="text-[12px] text-muted">
                    {service.description} | Port {service.port}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <Badge status={service.status} label={STATUS_LABEL[service.status]} />
                </td>
                <td className="py-3 pr-4 text-[13px] text-muted">{service.uptime}</td>
                <td className="py-3 pr-4">
                  <div className="flex min-w-[88px] items-center gap-2">
                    <span className="w-8 text-[13px] tabular-nums text-muted">{service.cpu}%</span>
                    <Progress
                      value={service.cpu}
                      ariaLabel={`CPU de ${service.name}`}
                      className="h-1 w-16"
                    />
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex min-w-[108px] items-center gap-2">
                    <span className="w-14 text-[13px] tabular-nums text-muted">
                      {service.memoryLabel}
                    </span>
                    <Progress
                      value={service.memoryPercent}
                      ariaLabel={`Memória de ${service.name}`}
                      className="h-1 w-16"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        to={ROUTES.services}
        className="mt-4 text-[13px] text-blue-accent transition-all duration-200 hover:underline hover:brightness-125"
      >
        Ver todos os serviços →
      </Link>
    </Card>
  );
}
