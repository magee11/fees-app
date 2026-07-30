import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentsApi from '../../api/payments';
import type { ListPaymentsParams } from '../../api/payments';
import type { CreatePaymentPayload } from '../../types/api';
import { PAYMENT_MUTATION_INVALIDATES, paymentKeys } from './keys';

export function usePayments(params: ListPaymentsParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.listPayments(params),
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: string | null) {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ''),
    queryFn: () => paymentsApi.getPayment(id as string),
    enabled: !!id,
  });
}

function useInvalidateAfterPaymentMutation() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of PAYMENT_MUTATION_INVALIDATES) queryClient.invalidateQueries({ queryKey: key });
  };
}

export function useCreatePayment() {
  const invalidate = useInvalidateAfterPaymentMutation();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.createPayment(payload),
    onSuccess: invalidate,
  });
}

export function useDeletePayment() {
  const invalidate = useInvalidateAfterPaymentMutation();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: invalidate,
  });
}
