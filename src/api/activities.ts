import { apiDelete, apiGet, apiPost, apiPut, type PaginationMeta } from './client';
import type { ActivityDTO, ActivityStatus } from '../types/api';

export interface ListActivitiesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

export interface ActivityFormPayload {
  name: string;
  coach: string;
  monthlyFee: number;
  schedule?: string;
  capacity?: number;
  status?: ActivityStatus;
  description?: string;
  color?: string;
  icon?: string;
}

export async function listActivities(params: ListActivitiesParams = {}): Promise<{ data: ActivityDTO[]; meta?: PaginationMeta }> {
  return apiGet<ActivityDTO[]>('/activities', params as Record<string, unknown>);
}

export async function getActivity(id: string): Promise<ActivityDTO> {
  const { data } = await apiGet<{ activity: ActivityDTO }>(`/activities/${id}`);
  return data.activity;
}

export async function createActivity(payload: ActivityFormPayload): Promise<ActivityDTO> {
  const { data } = await apiPost<{ activity: ActivityDTO }>('/activities', payload);
  return data.activity;
}

export async function updateActivity(id: string, payload: Partial<ActivityFormPayload>): Promise<ActivityDTO> {
  const { data } = await apiPut<{ activity: ActivityDTO }>(`/activities/${id}`, payload);
  return data.activity;
}

export async function deleteActivity(id: string): Promise<void> {
  await apiDelete(`/activities/${id}`);
}
