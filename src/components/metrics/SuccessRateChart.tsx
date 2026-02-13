'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PromptMetricsTimeSeriesPoint } from '@/lib/metrics/promptMetrics';

interface SuccessRateChartProps {
  data: PromptMetricsTimeSeriesPoint[];
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  const width = 920;
  const height = 240;
  const padding = 24;
  const maxY = 100;

  if (data.length === 0) {
    return (
      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Onnistumisaste ajassa</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 dark:text-gray-400">
          Ei dataa valitulla aikavälillä.
        </CardContent>
      </Card>
    );
  }

  const points = data.map((point, index) => {
    const x = data.length === 1
      ? width / 2
      : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + ((maxY - point.successRate) / maxY) * (height - padding * 2);
    return { x, y, ...point };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <CardTitle className="text-base">Onnistumisaste ajassa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full h-[260px]" role="img" aria-label="Onnistumisaste aikajanalla">
            <rect x={0} y={0} width={width} height={height} fill="transparent" />
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = padding + ((maxY - tick) / maxY) * (height - padding * 2);
              return (
                <g key={tick}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" opacity={0.1} />
                  <text x={4} y={y + 4} className="fill-gray-500 text-[10px]">{tick}%</text>
                </g>
              );
            })}
            <path d={path} fill="none" stroke="#4f46e5" strokeWidth={3} strokeLinecap="round" />
            {points.map((point) => (
              <g key={point.date}>
                <circle cx={point.x} cy={point.y} r={4} fill="#4f46e5" />
                <title>{`${point.date}: ${point.successRate.toFixed(2)}%`}</title>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
