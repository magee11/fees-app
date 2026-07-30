import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as activitiesApi from '../../api/activities';
import type { ActivityFormPayload, ListActivitiesParams } from '../../api/activities';
import { activityKeys, dashboardKeys } from './keys';

export function useActivities(params: ListActivitiesParams = {}) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activitiesApi.listActivities(params),
  });
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: activityKeys.detail(id ?? ''),
    queryFn: () => activitiesApi.getActivity(id as string),
    enabled: !!id,
  });
}

function useInvalidateAfterActivityMutation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}

export function useCreateActivity() {
  const invalidate = useInvalidateAfterActivityMutation();
  return useMutation({
    mutationFn: (payload: ActivityFormPayload) => activitiesApi.createActivity(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateActivity() {
  const invalidate = useInvalidateAfterActivityMutation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ActivityFormPayload> }) =>
      activitiesApi.updateActivity(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteActivity() {
  const invalidate = useInvalidateAfterActivityMutation();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.deleteActivity(id),
    onSuccess: invalidate,
  });
}
