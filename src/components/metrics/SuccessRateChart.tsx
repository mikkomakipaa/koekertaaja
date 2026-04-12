'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PromptMetricsTimeSeriesPoint } from '@/lib/metrics/promptMetrics';

interface ChartProps {
  data: PromptMetricsTimeSeriesPoint[];
}

function MiniLineChart({
  values,
  color,
  label,
  formatY,
  maxY,
}: {
  values: number[];
  color: string;
  label: string;
  formatY: (v: number) => string;
  maxY: number;
}) {
  const width = 920;
  const height = 180;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 20;

  const innerW = width - paddingLeft - paddingRight;
  const innerH = height - paddingTop - paddingBottom;

  if (values.length === 0) return null;

  const safeMax = maxY > 0 ? maxY : 1;
  const points = values.map((v, i) => ({
    x: paddingLeft + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: paddingTop + ((safeMax - Math.min(v, safeMax)) / safeMax) * innerH,
    v,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Y-axis ticks: 0, 50%, 100% of max
  const ticks = [0, 0.5, 1].map((pct) => ({
    value: safeMax * pct,
    y: paddingTop + (1 - pct) * innerH,
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full" style={{ height: height }} aria-label={label}>
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {ticks.map(({ value, y }) => (
        <g key={value}>
          <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" opacity={0.1} />
          <text x={paddingLeft - 4} y={y + 4} textAnchor="end" className="fill-gray-500 text-[10px]" fontSize={10}>
            {formatY(value)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <title>{`${formatY(p.v)}`}</title>
        </g>
      ))}
    </svg>
  );
}

export function SuccessRateChart({ data }: ChartProps) {
  const hasData = data.some((d) => d.sessions > 0);

  const labels = data.map((d) => {
    const [, m, day] = d.date.split('-');
    return `${day}.${m}`;
  });

  const latencyValues = data.map((d) => d.avgLatencyMs / 1000);
  const costValues = data.map((d) => d.totalCostUsd);

  const maxLatency = Math.max(...latencyValues, 0.1);
  const maxCost = Math.max(...costValues, 0.0001);

  return (
    <div className="grid gap-4 md:grid-cols-2">
        <Card variant="elevated" padding="standard">
          <CardHeader>
            <CardTitle className="text-base">Viive ajassa (s)</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei dataa.</p>
            ) : (
              <div className="w-full overflow-x-auto space-y-1">
                <MiniLineChart
                  values={latencyValues}
                  color="#0891b2"
                  label="Viive sekunteina"
                  formatY={(v) => `${v.toFixed(1)}s`}
                  maxY={maxLatency}
                />
                <DateAxis labels={labels} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" padding="standard">
          <CardHeader>
            <CardTitle className="text-base">Kustannus ajassa (€)</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei dataa.</p>
            ) : (
              <div className="w-full overflow-x-auto space-y-1">
                <MiniLineChart
                  values={costValues}
                  color="#d97706"
                  label="Päiväkustannus euroina"
                  formatY={(v) => `€${v.toFixed(4)}`}
                  maxY={maxCost}
                />
                <DateAxis labels={labels} />
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

function DateAxis({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  // Show at most ~8 labels to avoid crowding
  const step = Math.max(1, Math.ceil(labels.length / 8));
  return (
    <div className="flex justify-between min-w-[640px] px-12">
      {labels.map((label, i) => (
        <span
          key={i}
          className="text-[10px] text-gray-400 dark:text-gray-500"
          style={{ visibility: i % step === 0 ? 'visible' : 'hidden' }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
