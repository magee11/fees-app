import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  value: string;
  trend: string;
  trendTone?: 'success' | 'warning' | 'danger' | 'neutral';
  iconTint?: string;
}

export function KpiCard({ label, icon: Icon, value, trend, trendTone = 'neutral', iconTint }: KpiCardProps) {
  const trendColor =
    trendTone === 'success'
      ? 'var(--success)'
      : trendTone === 'warning'
        ? 'var(--warning)'
        : trendTone === 'danger'
          ? 'var(--danger)'
          : 'var(--text-secondary)';

  return (
    <div className="card kpi-card">
      <div className="kpi-card-top">
        <span className="card-kicker">{label}</span>
        <span className="kpi-icon" style={{ color: iconTint ?? 'var(--accent)' }}>
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-trend" style={{ color: trendColor }}>
        {trend}
      </div>
    </div>
  );
}
