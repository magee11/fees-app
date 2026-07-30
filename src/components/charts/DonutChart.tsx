import type { ActivityShare } from './types';

interface DonutChartProps {
  data: ActivityShare[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 180, centerLabel, centerValue }: DonutChartProps) {
  let cumulative = 0;
  const stops = data
    .map((d) => {
      const start = cumulative;
      cumulative += d.percent;
      return `${d.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: '50%',
            background: 'var(--card)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerValue && <div style={{ fontSize: 18, fontWeight: 700 }}>{centerValue}</div>}
          {centerLabel && (
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{centerLabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
