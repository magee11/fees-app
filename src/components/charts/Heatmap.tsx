import type { MonthPoint } from './types';

interface HeatmapProps {
  data: MonthPoint[];
}

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {data.map((d) => {
        const opacity = 0.12 + (d.value / max) * 0.78;
        return (
          <div
            key={d.label}
            title={`${d.label}: ${d.value}`}
            style={{
              aspectRatio: '1',
              borderRadius: 9,
              background: `rgba(59,130,246,${opacity.toFixed(2)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              fontWeight: 600,
              color: opacity > 0.5 ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {d.label}
          </div>
        );
      })}
    </div>
  );
}
