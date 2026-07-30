import { apiGet, apiPost } from './client';
import type { UserDTO } from '../types/api';

export interface AuthTokens {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiPost<AuthTokens>('/auth/login', { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

export async function getMe(): Promise<UserDTO> {
  const { data } = await apiGet<{ user: UserDTO }>('/auth/me');
  return data.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPost('/auth/change-password', { currentPassword, newPassword });
}
