import * as tokenStorage from './tokenStorage';
import type { UserDTO } from '../types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fees-app-backend.onrender.com/api/v1';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errors: ApiFieldError[];
  constructor(message: string, status: number, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface AuthTokens {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

let onAuthFailure: (() => void) | null = null;
export function registerAuthFailureHandler(fn: () => void): void {
  onAuthFailure = fn;
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new ApiError('No refresh token', 401);

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? 'Session expired', res.status, json?.errors ?? []);
  }
  const tokens = json.data as AuthTokens;
  tokenStorage.setAccessToken(tokens.accessToken);
  tokenStorage.setRefreshToken(tokens.refreshToken);
  tokenStorage.setPersistedUser(tokens.user);
  return tokens.accessToken;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function buildHeaders(body: unknown, accessToken: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (!(body instanceof FormData) && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return headers;
}

const NO_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, unknown>;
  isRetry?: boolean;
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  const { method = 'GET', body, params, isRetry = false } = opts;
  const url = `${API_BASE_URL}${path}${buildQueryString(params)}`;
  const skipAuth = NO_AUTH_PATHS.includes(path);
  const accessToken = skipAuth ? null : tokenStorage.getAccessToken();

  const res = await fetch(url, {
    method,
    headers: buildHeaders(body, accessToken),
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (res.status === 401 && !skipAuth && !isRetry) {
    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
      return request<T>(path, { ...opts, isRetry: true });
    } catch (err) {
      tokenStorage.clearAll();
      onAuthFailure?.();
      throw err;
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    if (res.status === 401 && !skipAuth) {
      tokenStorage.clearAll();
      onAuthFailure?.();
    }
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.errors ?? []);
  }
  return { data: json.data as T, meta: json.meta as PaginationMeta | undefined };
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match?.[1] ?? fallback;
}

export async function requestBlob(
  path: string,
  opts: RequestOptions & { fallbackFilename: string },
): Promise<{ blob: Blob; filename: string }> {
  const { method = 'GET', body, params, fallbackFilename, isRetry = false } = opts;
  const url = `${API_BASE_URL}${path}${buildQueryString(params)}`;
  const accessToken = tokenStorage.getAccessToken();

  const res = await fetch(url, {
    method,
    headers: buildHeaders(body, accessToken),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && !isRetry) {
    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
      return requestBlob(path, { ...opts, isRetry: true });
    } catch (err) {
      tokenStorage.clearAll();
      onAuthFailure?.();
      throw err;
    }
  }

  const contentType = res.headers.get('Content-Type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    const json = await res.json().catch(() => null);
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.errors ?? []);
  }

  const blob = await res.blob();
  const filename = filenameFromContentDisposition(res.headers.get('Content-Disposition'), fallbackFilename);
  return { blob, filename };
}

interface UploadOptions {
  onProgress?: (percent: number) => void;
  isRetry?: boolean;
}

/**
 * multipart upload with real upload-progress reporting — fetch() has no portable
 * way to observe request-body upload progress, so this uses XMLHttpRequest instead
 * for the two flows that actually need a progress bar (student import, logo
 * upload), while everything else keeps using the simpler fetch-based `request()`.
 */
export function uploadWithProgress<T>(
  path: string,
  formData: FormData,
  opts: UploadOptions = {},
): Promise<{ data: T }> {
  const { onProgress, isRetry = false } = opts;
  const accessToken = tokenStorage.getAccessToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onerror = () => reject(new ApiError('Network error during upload', 0));

    xhr.onload = async () => {
      let json: { success?: boolean; message?: string; errors?: ApiFieldError[]; data?: T } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON response — json stays null, handled as a generic failure below
      }

      if (xhr.status === 401 && !isRetry) {
        try {
          if (!refreshInFlight) {
            refreshInFlight = refreshAccessToken().finally(() => {
              refreshInFlight = null;
            });
          }
          await refreshInFlight;
          resolve(uploadWithProgress<T>(path, formData, { onProgress, isRetry: true }));
        } catch (err) {
          tokenStorage.clearAll();
          onAuthFailure?.();
          reject(err);
        }
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !json?.success) {
        if (xhr.status === 401) {
          tokenStorage.clearAll();
          onAuthFailure?.();
        }
        reject(new ApiError(json?.message ?? `Request failed (${xhr.status})`, xhr.status, json?.errors ?? []));
        return;
      }

      resolve({ data: json.data as T });
    };

    xhr.send(formData);
  });
}

export const apiGet = <T>(path: string, params?: Record<string, unknown>) => request<T>(path, { method: 'GET', params });
export const apiPost = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body });
export const apiPut = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body });
export const apiPatch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body });
export const apiDelete = <T>(path: string) => request<T>(path, { method: 'DELETE' });
