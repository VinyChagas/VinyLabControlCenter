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
import type { ResourceHistoryPoint } from '@/types';

interface ResourceChartProps {
  data: ResourceHistoryPoint[];
}

const AXIS_TICKS = [0, 4, 8, 12, 16, 20, 24];

function tickLabel(hour: number, points: ResourceHistoryPoint[]): string {
  return points.find((point) => point.hour === hour)?.label ?? '';
}

export function ResourceChart({ data }: ResourceChartProps) {
  return (
    <Card className="flex min-h-[340px] flex-col p-5 animate-slide-up stagger-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text">Uso de Recursos</h2>
          <p className="mt-0.5 text-[12px] text-muted">Últimas 24 horas</p>
        </div>
        <label className="sr-only" htmlFor="resource-range">
          Intervalo do gráfico
        </label>
        <select
          id="resource-range"
          className="rounded-md border border-line bg-card-elevated px-2.5 py-1 text-[12px] text-muted outline-none transition-colors duration-200 hover:border-blue-accent/30 focus:border-blue-accent/40"
          defaultValue="24h"
        >
          <option value="24h">24h</option>
        </select>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 24]}
              ticks={AXIS_TICKS}
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
