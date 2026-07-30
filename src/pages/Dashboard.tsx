import {
  Users,
  IndianRupee,
  Wallet,
  TrendingUp,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { AreaLineChart } from '../components/charts/AreaLineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Heatmap } from '../components/charts/Heatmap';
import { Avatar } from '../components/Avatar';
import { useDashboard } from '../hooks/queries/useDashboard';
import { formatCurrency } from '../utils/currency';
import { monthShort } from '../utils/months';
import { gradientForId, CHART_PALETTE } from '../utils/gradient';
import { refName } from '../types/api';
import { todayISODate } from '../utils/date';

export function Dashboard() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="fade-up empty-state" style={{ padding: '80px 0' }}>
        Loading dashboard…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="fade-up empty-state" style={{ padding: '80px 0' }}>
        Couldn&apos;t load the dashboard.{' '}
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const revenueSeries = data.monthlyRevenueChart.map((m) => ({ label: monthShort(m.month), value: m.revenue }));
  const totalActivityRevenue = data.activityRevenue.reduce((sum, a) => sum + a.revenue, 0);
  const distribution = data.activityRevenue.map((a, i) => ({
    id: a.activityId,
    name: a.name,
    revenue: a.revenue,
    percent: totalActivityRevenue === 0 ? 0 : Math.round((a.revenue / totalActivityRevenue) * 1000) / 10,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  const activityBreakdown = [...data.activityRevenue].sort((a, b) => b.revenue - a.revenue);
  const maxActivityRevenue = Math.max(...activityBreakdown.map((a) => a.revenue), 1);

  const today = todayISODate();
  const todaysCollections = data.recentPayments.filter((t) => t.paymentDate.slice(0, 10) === today);
  const todaysTotal = todaysCollections.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of activity fee collections and trends</div>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Total Students" icon={Users} value={data.totalStudents.toString()} trend="Across all activities" />
        <KpiCard
          label="Monthly Revenue"
          icon={IndianRupee}
          value={formatCurrency(data.monthlyRevenue)}
          trend="This month"
          trendTone="success"
        />
        <KpiCard
          label="Outstanding Balance"
          icon={Wallet}
          value={formatCurrency(data.outstandingBalance)}
          trend="Across all activities"
          trendTone="warning"
        />
        <KpiCard
          label="Collection Rate"
          icon={TrendingUp}
          value={`${data.collectionPercentage}%`}
          trend="This month"
          trendTone="success"
        />
        <KpiCard
          label="Active Activities"
          icon={Target}
          value={data.activeActivities.toString()}
          trend="Currently running"
        />
        <KpiCard
          label="Students with Dues"
          icon={AlertTriangle}
          value={data.pendingCount.toString()}
          trend="Need follow-up"
          trendTone="danger"
        />
      </div>

      <div className="dash-row">
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Revenue</div>
              <div className="card-title">Monthly Collection Trend</div>
            </div>
          </div>
          {revenueSeries.length > 0 ? (
            <AreaLineChart data={revenueSeries} color="#3B82F6" formatValue={formatCurrency} />
          ) : (
            <div className="empty-state">No revenue data yet.</div>
          )}
        </div>

        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Breakdown</div>
              <div className="card-title">Activity Distribution</div>
            </div>
          </div>
          {distribution.length > 0 ? (
            <>
              <DonutChart data={distribution} centerValue={`${distribution.length}`} centerLabel="activities" />
              <div className="legend-list">
                {distribution.map((d) => (
                  <div key={d.id} className="legend-row">
                    <span className="legend-label">
                      <span className="legend-swatch" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="legend-value">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No revenue recorded yet.</div>
          )}
        </div>
      </div>

      <div className="dash-row">
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Breakdown</div>
              <div className="card-title">Activity Revenue</div>
            </div>
          </div>
          {activityBreakdown.length > 0 ? (
            <div className="hbar-list">
              {activityBreakdown.map((a) => (
                <div key={a.activityId} className="hbar-row">
                  <span className="hbar-label">{a.name}</span>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(a.revenue / maxActivityRevenue) * 100}%`, background: a.color }}
                    />
                  </div>
                  <span className="hbar-value">{formatCurrency(a.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No revenue recorded yet.</div>
          )}
        </div>

        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Heatmap</div>
              <div className="card-title">Payment Heatmap</div>
            </div>
          </div>
          {revenueSeries.length > 0 ? (
            <Heatmap data={revenueSeries} />
          ) : (
            <div className="empty-state">No revenue data yet.</div>
          )}
        </div>
      </div>

      <div className="dash-bottom-row">
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Activity</div>
              <div className="card-title">Recent Transactions</div>
            </div>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="empty-state">No payments recorded yet.</div>
          ) : (
            <div className="txn-list">
              {data.recentPayments.map((t) => {
                const name = refName(t.studentId, 'Deleted Student');
                const activityName = t.activityId?.name ?? 'Deleted Activity';
                return (
                  <div key={t._id} className="txn-row">
                    <Avatar name={name} gradient={gradientForId(t._id)} size={34} />
                    <div className="txn-info">
                      <div className="txn-name">{name}</div>
                      <div className="txn-sub">
                        {activityName} · {t.paymentMode}
                      </div>
                    </div>
                    <div className="txn-amount">+{formatCurrency(t.total)}</div>
                    <div className="txn-date">{t.paymentDate.slice(5, 10)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="card mini-widget">
            <div className="card-kicker">Today</div>
            <div className="card-title">Today&apos;s Collections</div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>{formatCurrency(todaysTotal)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {todaysCollections.length} payments received
            </div>
          </div>

          <div className="card mini-widget">
            <div className="card-kicker">Follow-up</div>
            <div className="card-title">Students with Dues</div>
            {data.pendingStudents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Everyone is paid up.</div>
            ) : (
              <div className="mini-widget-list">
                {data.pendingStudents.map((s) => (
                  <div key={s.studentId} className="mini-widget-item">
                    <span className="mini-widget-name">{s.name}</span>
                    <span className="mini-widget-value" style={{ color: 'var(--danger)' }}>
                      {formatCurrency(s.outstanding)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
