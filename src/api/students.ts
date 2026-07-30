import { apiDelete, apiGet, apiPost, apiPut, type PaginationMeta } from './client';
import type { MonthlyStatusEntry, PaymentDTO, StudentDTO, StudentFormPayload } from '../types/api';

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  standard?: string;
  section?: string;
  activityId?: string;
  status?: string;
}

export async function listStudents(params: ListStudentsParams = {}): Promise<{ data: StudentDTO[]; meta?: PaginationMeta }> {
  return apiGet<StudentDTO[]>('/students', params as Record<string, unknown>);
}

export async function getStudent(id: string): Promise<StudentDTO> {
  const { data } = await apiGet<{ student: StudentDTO }>(`/students/${id}`);
  return data.student;
}

function toStudentFormData(payload: Partial<StudentFormPayload>, photo?: File | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (key === 'activities' && Array.isArray(value)) {
      // Bracket-indexed keys force multer/append-field to always parse this as an
      // array, even with exactly one activity selected (a bare repeated `activities`
      // key only becomes an array once it appears 2+ times, which would fail the
      // backend's z.array(objectId) validation for a single-activity student).
      value.forEach((activityId, i) => form.append(`activities[${i}]`, activityId));
    } else {
      form.append(key, String(value));
    }
  }
  if (photo) form.append('photo', photo);
  return form;
}

export async function createStudent(payload: StudentFormPayload, photo?: File | null): Promise<StudentDTO> {
  const { data } = await apiPost<{ student: StudentDTO }>('/students', toStudentFormData(payload, photo));
  return data.student;
}

export async function updateStudent(
  id: string,
  payload: Partial<StudentFormPayload>,
  photo?: File | null,
): Promise<StudentDTO> {
  const { data } = await apiPut<{ student: StudentDTO }>(`/students/${id}`, toStudentFormData(payload, photo));
  return data.student;
}

export async function deleteStudent(id: string): Promise<void> {
  await apiDelete(`/students/${id}`);
}

export async function getPaymentHistory(
  id: string,
  params: { page?: number; limit?: number; activityId?: string } = {},
): Promise<{ data: PaymentDTO[]; meta?: PaginationMeta }> {
  return apiGet<PaymentDTO[]>(`/students/${id}/payment-history`, params as Record<string, unknown>);
}

export async function getMonthlyStatus(id: string, year?: number): Promise<MonthlyStatusEntry[]> {
  const { data } = await apiGet<MonthlyStatusEntry[]>(`/students/${id}/monthly-status`, year ? { year } : undefined);
  return data;
}
