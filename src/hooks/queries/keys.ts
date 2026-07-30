import type { ListActivitiesParams } from '../../api/activities';
import type { ListPaymentsParams } from '../../api/payments';
import type { ListTrackerParams } from '../../api/monthlyTracker';
import type { ListStudentsParams } from '../../api/students';
import type { ListUsersParams } from '../../api/users';
import type { ReportEndpoint, ReportParams } from '../../types/api';

export const studentKeys = {
  all: ['students'] as const,
  list: (params: ListStudentsParams) => [...studentKeys.all, 'list', params] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
  paymentHistory: (id: string, params: { page?: number; limit?: number; activityId?: string }) =>
    [...studentKeys.detail(id), 'payment-history', params] as const,
  monthlyStatus: (id: string, year?: number) => [...studentKeys.detail(id), 'monthly-status', year] as const,
};

export const activityKeys = {
  all: ['activities'] as const,
  list: (params: ListActivitiesParams) => [...activityKeys.all, 'list', params] as const,
  detail: (id: string) => [...activityKeys.all, 'detail', id] as const,
};

export const paymentKeys = {
  all: ['payments'] as const,
  list: (params: ListPaymentsParams) => [...paymentKeys.all, 'list', params] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
};

export const monthlyTrackerKeys = {
  all: ['monthlyTracker'] as const,
  list: (params: ListTrackerParams) => [...monthlyTrackerKeys.all, 'list', params] as const,
  detail: (studentId: string, activityId: string, year?: number) =>
    [...monthlyTrackerKeys.all, 'detail', studentId, activityId, year] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  report: (endpoint: ReportEndpoint, params: ReportParams) => [...reportKeys.all, endpoint, params] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
};

export const userKeys = {
  all: ['users'] as const,
  list: (params: ListUsersParams) => [...userKeys.all, 'list', params] as const,
};

/** Shared side-effect invalidation set for anything that records/reverses a payment. */
export const PAYMENT_MUTATION_INVALIDATES = [studentKeys.all, monthlyTrackerKeys.all, dashboardKeys.all, paymentKeys.all];
