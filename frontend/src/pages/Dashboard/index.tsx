import { ApiUsage } from '@/components/dashboard/ApiUsage';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { ServicesTable } from '@/components/dashboard/ServicesTable';
import { SystemInfo } from '@/components/dashboard/SystemInfo';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useDashboard } from '@/hooks/useDashboard';

export function DashboardPage() {
  const {
    metrics,
    resourceHistory,
    historyRange,
    setHistoryRange,
    apiUsage,
    quickLinks,
    services,
    system,
    loading,
    error,
    reload,
    metricsUnavailable,
  } = useDashboard();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && metrics.every((m) => m.value === '--') && services.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card px-5 py-8 text-center animate-fade-in">
        <p className="text-sm text-muted">{error}</p>
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
      {metricsUnavailable ? (
        <p className="text-[12px] text-muted animate-fade-in">
          Métricas em tempo real indisponíveis — exibindo histórico quando houver.
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <ResourceChart
            data={resourceHistory}
            range={historyRange}
            onRangeChange={setHistoryRange}
          />
        </div>
        <div className="lg:col-span-1 xl:col-span-3">
          <ApiUsage items={apiUsage} />
        </div>
        <div className="lg:col-span-1 xl:col-span-3">
          <QuickLinks links={quickLinks} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
          <ServicesTable services={services} />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <SystemInfo system={system} />
        </div>
      </section>
    </div>
  );
}
