import { apiGet, apiPut, uploadWithProgress } from './client';
import type { SettingsDTO, SettingsFormPayload } from '../types/api';

export async function getSettings(): Promise<SettingsDTO> {
  const { data } = await apiGet<{ settings: SettingsDTO }>('/settings');
  return data.settings;
}

export async function updateSettings(payload: SettingsFormPayload): Promise<SettingsDTO> {
  const { data } = await apiPut<{ settings: SettingsDTO }>('/settings', payload);
  return data.settings;
}

export async function uploadLogo(file: File, onProgress?: (percent: number) => void): Promise<SettingsDTO> {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await uploadWithProgress<{ settings: SettingsDTO }>('/settings/logo', form, { onProgress });
  return data.settings;
}
