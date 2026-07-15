import { Order, Driver } from '@/types';

export interface AgencyMetrics {
  TotalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  pendingPickups: number;
  ongoingDeliveries: number;
  activeDrivers: number;
  TotalRevenue: number;
  walletBalance: number;
  pendingCOD: number;
  issuesCount: number;
  weeklyOrders: Array<{ Date: string; count: number }>;
  driversStatus: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardState {
  metrics: AgencyMetrics | null;
  orders: Order[];
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}
