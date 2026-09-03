import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { MetricsHistoryRange } from '@/api/metricsApi';
import type { ResourceHistoryPoint } from '@/types';

interface ResourceChartProps {
  data: ResourceHistoryPoint[];
  range: MetricsHistoryRange;
  onRangeChange: (range: MetricsHistoryRange) => void;
}

const RANGE_LABEL: Record<MetricsHistoryRange, string> = {
  '1h': 'Última 1 hora',
  '6h': 'Últimas 6 horas',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
};

function tickLabel(hour: number, points: ResourceHistoryPoint[]): string {
  return points.find((point) => point.hour === hour)?.label ?? '';
}

function buildTicks(length: number): number[] {
  if (length <= 1) return [0];
  const maxTicks = Math.min(7, length);
  const ticks: number[] = [];
  for (let i = 0; i < maxTicks; i += 1) {
    ticks.push(Math.round((i * (length - 1)) / (maxTicks - 1)));
  }
  return [...new Set(ticks)];
}

export function ResourceChart({ data, range, onRangeChange }: ResourceChartProps) {
  const domainMax = Math.max(data.length - 1, 1);
  const ticks = buildTicks(data.length);

  return (
    <Card className="flex min-h-[340px] flex-col p-5 animate-slide-up stagger-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text">Uso de Recursos</h2>
          <p className="mt-0.5 text-[12px] text-muted">{RANGE_LABEL[range]}</p>
        </div>
        <label className="sr-only" htmlFor="resource-range">
          Intervalo do gráfico
        </label>
        <select
          id="resource-range"
          className="rounded-md border border-line bg-card-elevated px-2.5 py-1 text-[12px] text-muted outline-none transition-colors duration-200 hover:border-blue-accent/30 focus:border-blue-accent/40"
          value={range}
          onChange={(event) => onRangeChange(event.target.value as MetricsHistoryRange)}
        >
          <option value="1h">1h</option>
          <option value="6h">6h</option>
          <option value="24h">24h</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
      </div>

      <div className="min-h-0 flex-1">
        {data.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-[13px] text-muted">
            Sem histórico ainda
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                type="number"
                domain={[0, domainMax]}
                ticks={ticks}
                tickFormatter={(hour: number) => tickLabel(hour, data)}
                tick={{ fill: '#6B7385', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: '#6B7385', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(22,139,255,0.25)' }}
                contentStyle={{
                  backgroundColor: '#080D14',
                  border: '1px solid #121A28',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(hour) => tickLabel(Number(hour), data)}
                formatter={(value, name) => [`${String(value)}%`, String(name)]}
                animationDuration={200}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="#7EC4FF"
                strokeWidth={1.6}
                dot={false}
                activeDot={{ r: 3, className: 'transition-all duration-200' }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="memory"
                name="Memória"
                stroke="#168BFF"
                strokeWidth={1.6}
                dot={false}
                activeDot={{ r: 3, className: 'transition-all duration-200' }}
                animationDuration={1400}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="storage"
                name="Armazenamento"
                stroke="#FF7900"
                strokeWidth={1.6}
                dot={false}
                activeDot={{ r: 3, className: 'transition-all duration-200' }}
                animationDuration={1600}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-4 text-[12px] text-muted">
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#7EC4FF]" />
          CPU
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-blue-accent" />
          Memória
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-orange-accent" />
          Armazenamento
        </li>
      </ul>
    </Card>
  );
}
