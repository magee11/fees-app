import type { UserDTO } from '../types/api';

const ACCESS_KEY = 'feeflow_access_token';
const REFRESH_KEY = 'feeflow_refresh_token';
const USER_KEY = 'feeflow_user';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_KEY, token);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}
export function getPersistedUser(): UserDTO | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDTO;
  } catch {
    return null;
  }
}
export function setPersistedUser(user: UserDTO): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearAll(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
