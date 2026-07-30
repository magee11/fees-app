import { apiGet } from './client';
import type { DashboardData } from '../types/api';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiGet<DashboardData>('/dashboard');
  return data;
}
