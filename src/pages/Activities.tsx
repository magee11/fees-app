import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditActivityDialog } from '../components/EditActivityDialog';
import { activityIcon } from '../components/icons';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useActivities, useDeleteActivity, useUpdateActivity } from '../hooks/queries/useActivities';
import { useReport } from '../hooks/queries/useReports';
import { formatCurrency } from '../utils/currency';
import { gradientFromHex } from '../utils/gradient';
import { ApiError } from '../api/client';
import type { ActivityDTO } from '../types/api';

function ActivityCard({
  activity,
  revenue,
  isAdmin,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  activity: ActivityDTO;
  revenue: number;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = activityIcon(activity.icon);
  const capacityPercent = activity.capacity === 0 ? 0 : Math.round((activity.enrolled / activity.capacity) * 100);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="activity-card" style={{ background: gradientFromHex(activity.color) }}>
      <div className="activity-card-top">
        <span className="activity-icon-box">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        {isAdmin && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="activity-kebab" onClick={() => setMenuOpen((v) => !v)} aria-label="Activity options">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="notif-dropdown activity-menu">
                <button
                  className="activity-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                >
                  Edit Activity
                </button>
                <button
                  className="activity-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleStatus();
                  }}
                >
                  {activity.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="activity-menu-item"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="activity-name">{activity.name}</div>
      <div className="activity-coach">{activity.coach}</div>

      <div className="activity-stats">
        <div>
          <span className="activity-stat-value">{activity.enrolled}</span>
          <span className="activity-stat-label">Students</span>
        </div>
        <div>
          <span className="activity-stat-value">{formatCurrency(revenue)}</span>
          <span className="activity-stat-label">Revenue</span>
        </div>
      </div>

      <div className="activity-capacity">
        <div className="activity-capacity-row">
          <span>Capacity</span>
          <span>
            {activity.enrolled}/{activity.capacity}
          </span>
        </div>
        <ProgressBar percent={capacityPercent} />
      </div>

      <div className="activity-footer">
        <span className="activity-fee">{formatCurrency(activity.monthlyFee)}/mo</span>
        {isAdmin && (
          <Button size="sm" variant="secondary" className="activity-manage-btn" onClick={onEdit}>
            Manage
          </Button>
        )}
      </div>
    </div>
  );
}

export function Activities() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const { data, isLoading, isError, refetch } = useActivities({ limit: 50 });
  const { data: report } = useReport('activity');
  const deleteActivity = useDeleteActivity();
  const updateActivity = useUpdateActivity();

  const [editTarget, setEditTarget] = useState<ActivityDTO | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ActivityDTO | null>(null);

  const activities = data?.data ?? [];

  const revenueByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of report?.rows ?? []) {
      map.set(row.name as string, (row.revenue as number) ?? 0);
    }
    return map;
  }, [report]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteActivity.mutateAsync(deleteTarget._id);
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete activity');
    }
  }

  async function handleToggleStatus(activity: ActivityDTO) {
    const nextStatus = activity.status === 'active' ? 'inactive' : 'active';
    try {
      await updateActivity.mutateAsync({ id: activity._id, payload: { status: nextStatus } });
      showToast(`${activity.name} ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update activity');
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Activities</div>
          <div className="page-subtitle">{activities.length} extra-curricular activities</div>
        </div>
        {isAdmin && (
          <div className="page-actions">
            <Button onClick={() => setEditTarget(null)}>
              <Plus size={15} />
              Add Activity
            </Button>
          </div>
        )}
      </div>

      {isLoading && <div className="empty-state">Loading activities…</div>}
      {isError && (
        <div className="empty-state">
          Couldn&apos;t load activities.{' '}
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="activities-grid">
          {activities.map((a) => (
            <ActivityCard
              key={a._id}
              activity={a}
              revenue={revenueByName.get(a.name) ?? 0}
              isAdmin={isAdmin}
              onEdit={() => setEditTarget(a)}
              onDelete={() => setDeleteTarget(a)}
              onToggleStatus={() => handleToggleStatus(a)}
            />
          ))}
        </div>
      )}

      <EditActivityDialog open={editTarget !== undefined} activity={editTarget ?? null} onClose={() => setEditTarget(undefined)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Activity"
        message={`Delete "${deleteTarget?.name}"? This can't be undone. Activities with active enrollments can't be deleted.`}
        confirmLabel="Delete"
        isBusy={deleteActivity.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
