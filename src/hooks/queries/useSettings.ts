import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '../../api/settings';
import type { SettingsFormPayload } from '../../types/api';
import { settingsKeys } from './keys';

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsApi.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsFormPayload) => settingsApi.updateSettings(payload),
    // Write the server's response straight into the cache instead of only
    // invalidating — guarantees every screen reading useSettings() reflects the
    // save immediately, with no dependency on a follow-up refetch actually landing.
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.all, data),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.all, data),
  });
}
