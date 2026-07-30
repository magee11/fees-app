import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../../api/dashboard';
import { dashboardKeys } from './keys';

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => dashboardApi.getDashboard(),
  });
}
