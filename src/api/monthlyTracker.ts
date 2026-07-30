import { apiGet, apiPatch, type PaginationMeta } from './client';
import type { CreatePaymentPayload, PaymentDTO, TrackerRow } from '../types/api';

export interface ListTrackerParams {
  page?: number;
  limit?: number;
  search?: string;
  activityId?: string;
  status?: string;
  year?: number;
}

export async function listTracker(params: ListTrackerParams = {}): Promise<{ data: TrackerRow[]; meta?: PaginationMeta }> {
  return apiGet<TrackerRow[]>('/monthly-tracker', params as Record<string, unknown>);
}

export async function getTrackerDetail(
  studentId: string,
  activityId: string,
  year?: number,
): Promise<TrackerRow & { payments: PaymentDTO[] }> {
  const { data } = await apiGet<TrackerRow & { payments: PaymentDTO[] }>(
    `/monthly-tracker/${studentId}/${activityId}`,
    year ? { year } : undefined,
  );
  return data;
}

export async function payMonths(payload: CreatePaymentPayload): Promise<PaymentDTO> {
  const { data } = await apiPatch<{ payment: PaymentDTO }>('/monthly-tracker/pay', payload);
  return data.payment;
}
