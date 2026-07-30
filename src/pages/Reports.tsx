import { useState } from 'react';
import { FileSpreadsheet, FileText, Calendar, TrendingUp, Wallet, IndianRupee } from 'lucide-react';
import { Button } from '../components/Button';
import { KpiCard } from '../components/KpiCard';
import { useToast } from '../context/ToastContext';
import { useDashboard } from '../hooks/queries/useDashboard';
import { useReport } from '../hooks/queries/useReports';
import { formatCurrency } from '../utils/currency';
import { monthShort } from '../utils/months';
import { CHART_PALETTE } from '../utils/gradient';
import { triggerBlobDownload } from '../utils/download';
import * as reportsApi from '../api/reports';

const CURRENT_YEAR = new Date().getFullYear();

export function Reports() {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  const { data: dashboard } = useDashboard();
  const { data: yearlyReport, isLoading: yearlyLoading } = useReport('yearly-collection', { year: CURRENT_YEAR });
  const { data: pendingReport } = useReport('pending');
  const { data: activityReport, isLoading: activityLoading } = useReport('activity');

  const yearlyRows = (yearlyReport?.rows ?? []) as { month: number; total: number; count: number }[];
  const yearlyRevenue = (yearlyReport?.summary?.totalRevenue as number) ?? 0;
  const pendingRevenue = (pendingReport?.summary?.totalOutstanding as number) ?? 0;

  const revenueSeries = yearlyRows.map((r) => ({ label: monthShort(r.month), value: r.total }));
  const maxRevenue = Math.max(...revenueSeries.map((m) => m.value), 1);

  const currentMonth = dashboard?.currentMonth ?? new Date().getMonth() + 1;
  const chart = dashboard?.monthlyRevenueChart ?? [];
  const currentMonthRevenue = chart.find((m) => m.month === currentMonth)?.revenue ?? 0;
  const previousMonthRevenue = chart.find((m) => m.month === currentMonth - 1)?.revenue ?? 0;
  const growth =
    previousMonthRevenue === 0 ? 0 : Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 1000) / 10;

  const activityRows = (activityReport?.rows ?? []) as { name: string; enrolled: number }[];
  const sortedActivityRows = [...activityRows].sort((a, b) => b.enrolled - a.enrolled);
  const maxEnrolled = Math.max(...sortedActivityRows.map((a) => a.enrolled), 1);

  async function handleExport(format: 'excel' | 'pdf') {
    setIsExporting(format);
    try {
      const { blob, filename } = await reportsApi.downloadReport('yearly-collection', { year: CURRENT_YEAR }, format);
      triggerBlobDownload(blob, filename);
    } catch {
      showToast('Failed to export report');
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">Revenue and collection insights</div>
        </div>
        <div className="page-actions">
          <Button variant="secondary" disabled={isExporting !== null} onClick={() => handleExport('excel')}>
            <FileSpreadsheet size={15} />
            {isExporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button variant="secondary" disabled={isExporting !== null} onClick={() => handleExport('pdf')}>
            <FileText size={15} />
            {isExporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="kpi-row reports-kpi-row">
        <KpiCard
          label="Monthly Collection"
          icon={IndianRupee}
          value={formatCurrency(dashboard?.monthlyRevenue ?? 0)}
          trend="This month"
        />
        <KpiCard label="Yearly Revenue" icon={Calendar} value={formatCurrency(yearlyRevenue)} trend={`${CURRENT_YEAR}`} />
        <KpiCard
          label="Growth %"
          icon={TrendingUp}
          value={`${growth > 0 ? '+' : ''}${growth}%`}
          trend="vs previous month"
          trendTone={growth >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Pending Revenue"
          icon={Wallet}
          value={formatCurrency(pendingRevenue)}
          trend="Outstanding across all students"
          trendTone="warning"
        />
      </div>

      <div className="dash-row">
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Revenue</div>
              <div className="card-title">Revenue by Month ({CURRENT_YEAR})</div>
            </div>
          </div>
          {yearlyLoading && <div className="empty-state">Loading…</div>}
          {!yearlyLoading && (
            <div className="bar-chart">
              {revenueSeries.map((m) => (
                <div key={m.label} className="bar-chart-col">
                  <div className="bar-chart-track">
                    <div
                      className="bar-chart-fill"
                      style={{ height: `${Math.max(4, (m.value / maxRevenue) * 100)}%` }}
                      title={`${m.label}: ${formatCurrency(m.value)}`}
                    />
                  </div>
                  <span className="bar-chart-label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-kicker">Enrollment</div>
              <div className="card-title">Students by Activity</div>
            </div>
          </div>
          {activityLoading && <div className="empty-state">Loading…</div>}
          {!activityLoading && (
            <div className="hbar-list">
              {sortedActivityRows.map((a, i) => (
                <div key={a.name} className="hbar-row">
                  <span className="hbar-label">{a.name}</span>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(a.enrolled / maxEnrolled) * 100}%`, background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                    />
                  </div>
                  <span className="hbar-value">{a.enrolled}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
