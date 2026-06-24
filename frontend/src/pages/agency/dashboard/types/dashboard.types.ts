import { Order, Driver } from '@/types';

export interface AgencyMetrics {
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  pendingPickups: number;
  ongoingDeliveries: number;
  activeDrivers: number;
  totalRevenue: number;
  walletBalance: number;
  pendingCOD: number;
  issuesCount: number;
  weeklyOrders: Array<{ date: string; count: number }>;
  driversStatus: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardState {
  metrics: AgencyMetrics | null;
  orders: Order[];
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}
