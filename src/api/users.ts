import { apiDelete, apiGet, apiPost, apiPut, type PaginationMeta } from './client';
import type { Role, UserDTO } from '../types/api';

export interface ListUsersParams {
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
  avatar?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  isActive?: boolean;
  avatar?: string;
}

export async function listUsers(params: ListUsersParams = {}): Promise<{ data: UserDTO[]; meta?: PaginationMeta }> {
  return apiGet<UserDTO[]>('/users', params as Record<string, unknown>);
}

export async function createUser(payload: CreateUserPayload): Promise<UserDTO> {
  const { data } = await apiPost<{ user: UserDTO }>('/users', payload);
  return data.user;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserDTO> {
  const { data } = await apiPut<{ user: UserDTO }>(`/users/${id}`, payload);
  return data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await apiDelete(`/users/${id}`);
}
