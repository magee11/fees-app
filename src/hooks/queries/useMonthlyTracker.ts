import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as trackerApi from '../../api/monthlyTracker';
import type { ListTrackerParams } from '../../api/monthlyTracker';
import type { CreatePaymentPayload } from '../../types/api';
import { PAYMENT_MUTATION_INVALIDATES, monthlyTrackerKeys } from './keys';

export function useTracker(params: ListTrackerParams = {}) {
  return useQuery({
    queryKey: monthlyTrackerKeys.list(params),
    queryFn: () => trackerApi.listTracker(params),
    placeholderData: keepPreviousData,
  });
}

export function useTrackerDetail(studentId: string | null, activityId: string | null, year: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: monthlyTrackerKeys.detail(studentId ?? '', activityId ?? '', year),
    queryFn: () => trackerApi.getTrackerDetail(studentId as string, activityId as string, year),
    enabled: enabled && !!studentId && !!activityId,
  });
}

export function usePayMonths() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => trackerApi.payMonths(payload),
    onSuccess: () => {
      for (const key of PAYMENT_MUTATION_INVALIDATES) queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
