import { apiDelete, apiGet, apiPost, apiPut, requestBlob, uploadWithProgress, type PaginationMeta } from './client';
import type {
  BulkDeleteStudentsResult,
  ImportStudentsResult,
  MonthlyStatusEntry,
  PaymentDTO,
  StudentDTO,
  StudentFormPayload,
} from '../types/api';

type BulkFormat = 'excel' | 'csv';
const BULK_EXTENSIONS: Record<BulkFormat, string> = { excel: 'xlsx', csv: 'csv' };

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

export async function createStudent(payload: StudentFormPayload): Promise<StudentDTO> {
  const { data } = await apiPost<{ student: StudentDTO }>('/students', payload);
  return data.student;
}

export async function updateStudent(id: string, payload: Partial<StudentFormPayload>): Promise<StudentDTO> {
  const { data } = await apiPut<{ student: StudentDTO }>(`/students/${id}`, payload);
  return data.student;
}

export async function deleteStudent(id: string): Promise<void> {
  await apiDelete(`/students/${id}`);
}

export async function bulkDeleteStudents(ids: string[]): Promise<BulkDeleteStudentsResult> {
  const { data } = await apiPost<BulkDeleteStudentsResult>('/students/bulk-delete', { ids });
  return data;
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

export interface ExportStudentsParams {
  search?: string;
  standard?: string;
  section?: string;
  activityId?: string;
  status?: string;
}

export async function exportStudents(
  params: ExportStudentsParams,
  format: BulkFormat = 'excel',
): Promise<{ blob: Blob; filename: string }> {
  return requestBlob('/students/export', {
    params: { ...params, format } as Record<string, unknown>,
    fallbackFilename: `students-export.${BULK_EXTENSIONS[format]}`,
  });
}

export async function downloadImportTemplate(format: BulkFormat = 'excel'): Promise<{ blob: Blob; filename: string }> {
  return requestBlob('/students/import-template', {
    params: { format },
    fallbackFilename: `student-import-template.${BULK_EXTENSIONS[format]}`,
  });
}

export async function importStudents(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ImportStudentsResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await uploadWithProgress<ImportStudentsResult>('/students/import', form, { onProgress });
  return data;
}
