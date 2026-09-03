import { cn } from '@/utils/format';
import { useMemo } from 'react';
import type { AccentColor } from '@/types';

interface SparklineProps {
  data: number[];
  accent?: AccentColor;
  className?: string;
  animated?: boolean;
}

function computePath(data: number[], width: number, height: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const d = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  let pathLength = 0;
  for (let i = 1; i < data.length; i++) {
    const dx = width / (data.length - 1);
    const y1 = height - ((data[i - 1]! - min) / range) * (height - 6) - 3;
    const y2 = height - ((data[i]! - min) / range) * (height - 6) - 3;
    const dy = y2 - y1;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }

  return { d, pathLength: Math.ceil(pathLength) };
}

export function Sparkline({ data, accent = 'blue', className, animated = true }: SparklineProps) {
  const width = 120;
  const height = 28;

  const { d, pathLength } = useMemo(() => {
    if (data.length < 2) {
      return { d: '', pathLength: 0 };
    }
    return computePath(data, width, height);
  }, [data]);

  if (data.length < 2) {
    return null;
  }

  const stroke = accent === 'orange' ? '#FF7900' : '#168BFF';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-7 w-full', animated && 'sparkline-animated', className)}
      aria-hidden
      preserveAspectRatio="none"
      style={animated ? { '--sparkline-length': pathLength } as React.CSSProperties : undefined}
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
