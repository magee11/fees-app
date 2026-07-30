import { apiGet, requestBlob } from './client';
import type { ReportEndpoint, ReportFormat, ReportParams, ReportResult } from '../types/api';

async function fetchReport(endpoint: ReportEndpoint, params: ReportParams = {}): Promise<ReportResult> {
  const { data } = await apiGet<ReportResult>(`/reports/${endpoint}`, params as Record<string, unknown>);
  return data;
}

export const getRevenueReport = (params?: ReportParams) => fetchReport('revenue', params);
export const getPendingReport = (params?: ReportParams) => fetchReport('pending', params);
export const getActivityReport = (params?: ReportParams) => fetchReport('activity', params);
export const getMonthlyCollectionReport = (params?: ReportParams) => fetchReport('monthly-collection', params);
export const getYearlyCollectionReport = (params?: ReportParams) => fetchReport('yearly-collection', params);

export async function getStudentLedger(studentId: string, params: ReportParams = {}): Promise<ReportResult> {
  const { data } = await apiGet<ReportResult>(`/reports/student-ledger/${studentId}`, params as Record<string, unknown>);
  return data;
}

const EXTENSIONS: Record<Exclude<ReportFormat, 'json'>, string> = {
  pdf: 'pdf',
  excel: 'xlsx',
  csv: 'csv',
};

export async function downloadReport(
  endpoint: ReportEndpoint,
  params: ReportParams,
  format: Exclude<ReportFormat, 'json'>,
): Promise<{ blob: Blob; filename: string }> {
  return requestBlob(`/reports/${endpoint}`, {
    params: { ...params, format },
    fallbackFilename: `${endpoint}-report.${EXTENSIONS[format]}`,
  });
}

export async function downloadStudentLedger(
  studentId: string,
  params: ReportParams,
  format: Exclude<ReportFormat, 'json'>,
): Promise<{ blob: Blob; filename: string }> {
  return requestBlob(`/reports/student-ledger/${studentId}`, {
    params: { ...params, format },
    fallbackFilename: `student-ledger.${EXTENSIONS[format]}`,
  });
}
