import { apiDelete, apiGet, apiPost, requestBlob, type PaginationMeta } from './client';
import type { CreatePaymentPayload, PaymentDTO } from '../types/api';

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  activityId?: string;
  paymentMode?: string;
  receiptNo?: string;
  fromDate?: string;
  toDate?: string;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentDTO> {
  const { data } = await apiPost<{ payment: PaymentDTO }>('/payments', payload);
  return data.payment;
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<{ data: PaymentDTO[]; meta?: PaginationMeta }> {
  return apiGet<PaymentDTO[]>('/payments', params as Record<string, unknown>);
}

export async function getPayment(id: string): Promise<PaymentDTO> {
  const { data } = await apiGet<{ payment: PaymentDTO }>(`/payments/${id}`);
  return data.payment;
}

export async function getReceiptBlob(id: string, receiptNo?: string): Promise<{ blob: Blob; filename: string }> {
  return requestBlob(`/payments/${id}/receipt`, { fallbackFilename: `${receiptNo ?? id}.pdf` });
}

export async function deletePayment(id: string): Promise<void> {
  await apiDelete(`/payments/${id}`);
}
