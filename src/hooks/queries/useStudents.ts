import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as studentsApi from '../../api/students';
import type { ListStudentsParams } from '../../api/students';
import type { StudentFormPayload } from '../../types/api';
import { activityKeys, dashboardKeys, studentKeys } from './keys';

export function useStudents(params: ListStudentsParams, enabled = true) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentsApi.listStudents(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? ''),
    queryFn: () => studentsApi.getStudent(id as string),
    enabled: !!id,
  });
}

export function useStudentPaymentHistory(
  id: string | null,
  params: { page?: number; limit?: number; activityId?: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: studentKeys.paymentHistory(id ?? '', params),
    queryFn: () => studentsApi.getPaymentHistory(id as string, params),
    enabled: enabled && !!id,
  });
}

export function useStudentMonthlyStatus(id: string | null, year: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: studentKeys.monthlyStatus(id ?? '', year),
    queryFn: () => studentsApi.getMonthlyStatus(id as string, year),
    enabled: enabled && !!id,
  });
}

function useInvalidateAfterStudentMutation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: studentKeys.all });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  };
}

export function useCreateStudent() {
  const invalidate = useInvalidateAfterStudentMutation();
  return useMutation({
    mutationFn: ({ payload, photo }: { payload: StudentFormPayload; photo?: File | null }) =>
      studentsApi.createStudent(payload, photo),
    onSuccess: invalidate,
  });
}

export function useUpdateStudent() {
  const invalidate = useInvalidateAfterStudentMutation();
  return useMutation({
    mutationFn: ({ id, payload, photo }: { id: string; payload: Partial<StudentFormPayload>; photo?: File | null }) =>
      studentsApi.updateStudent(id, payload, photo),
    onSuccess: invalidate,
  });
}

export function useDeleteStudent() {
  const invalidate = useInvalidateAfterStudentMutation();
  return useMutation({
    mutationFn: (id: string) => studentsApi.deleteStudent(id),
    onSuccess: invalidate,
  });
}
