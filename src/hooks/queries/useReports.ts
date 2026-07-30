import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '../../api/reports';
import type { ReportEndpoint, ReportParams } from '../../types/api';
import { reportKeys } from './keys';

const FETCHERS: Record<ReportEndpoint, (params?: ReportParams) => ReturnType<typeof reportsApi.getRevenueReport>> = {
  revenue: reportsApi.getRevenueReport,
  pending: reportsApi.getPendingReport,
  activity: reportsApi.getActivityReport,
  'monthly-collection': reportsApi.getMonthlyCollectionReport,
  'yearly-collection': reportsApi.getYearlyCollectionReport,
};

export function useReport(endpoint: ReportEndpoint, params: ReportParams = {}) {
  return useQuery({
    queryKey: reportKeys.report(endpoint, params),
    queryFn: () => FETCHERS[endpoint](params),
  });
}
