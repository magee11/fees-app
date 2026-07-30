import type { MonthPoint } from './types';

interface AreaLineChartProps {
  data: MonthPoint[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function AreaLineChart({
  data,
  color = '#3B82F6',
  height = 220,
  formatValue,
}: AreaLineChartProps) {
  const width = 640;
  const padding = 24;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((d.value - min) / (max - min || 1)) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`;

  const gradientId = `area-gradient-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          <text
            x={p.x}
            y={height - 4}
            fontSize={10}
            textAnchor="middle"
            fill="var(--text-muted)"
          >
            {p.label}
          </text>
        </g>
      ))}
      <title>{data.map((d) => `${d.label}: ${formatValue ? formatValue(d.value) : d.value}`).join(', ')}</title>
    </svg>
  );
}
