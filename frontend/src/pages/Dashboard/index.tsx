import { ApiUsage } from '@/components/dashboard/ApiUsage';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { ServicesTable } from '@/components/dashboard/ServicesTable';
import { SystemInfo } from '@/components/dashboard/SystemInfo';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useDashboard } from '@/hooks/useDashboard';

export function DashboardPage() {
  const { data, loading, error, reload } = useDashboard();

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-line bg-card px-5 py-8 text-center animate-fade-in">
        <p className="text-sm text-muted">{error ?? 'Não foi possível carregar o dashboard.'}</p>
        <button
          type="button"
          className="mt-4 rounded-lg border border-line px-4 py-2 text-[13px] text-blue-accent transition-all duration-200 hover:bg-blue-accent/10"
          onClick={reload}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Metrics row — 5 cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </section>

      {/* Middle row — chart 50%, APIs 25%, shortcuts 25% */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <ResourceChart data={data.resourceHistory} />
        </div>
        <div className="lg:col-span-1 xl:col-span-3">
          <ApiUsage items={data.apiUsage} />
        </div>
        <div className="lg:col-span-1 xl:col-span-3">
          <QuickLinks links={data.quickLinks} />
        </div>
      </section>

      {/* Bottom row — services table + system info */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
          <ServicesTable services={data.services} />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <SystemInfo system={data.system} />
        </div>
      </section>
    </div>
  );
}
