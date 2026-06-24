import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface ShiftSummary {
  shiftId: string;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalEarnings: number;
  totalCOD: number;
  totalDistanceKm: number;
  avgDeliveryTimeMin: number;
  slaBreaches: number;
  incidentCount: number;
}

export interface PerformanceStat {
  label: string;
  value: number;
  unit: string;
  change: number; // % vs last week
  trend: 'up' | 'down' | 'flat';
}

export interface WeeklyPerformance {
  week: string;
  days: {
    date: string;          // "Lun", "Mar"...
    deliveries: number;
    earnings: number;
    successRate: number;
  }[];
  totalEarnings: number;
  totalDeliveries: number;
  avgSuccessRate: number;
  topDay: string;
  rank: number;            // rank among agency drivers
  totalDrivers: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji
  earnedAt: string;
  type: 'GOLD' | 'SILVER' | 'BRONZE';
}

export interface ShiftGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  type: 'DELIVERIES' | 'EARNINGS' | 'SUCCESS_RATE' | 'DISTANCE';
}

const shiftService = {
  startShift: async (): Promise<ShiftSummary> => {
    const res = await apiClient.post<ShiftSummary>(ENDPOINTS.DRIVERS.SHIFT.START);
    return res.data;
  },
  getCurrentShift: async (): Promise<ShiftSummary | null> => {
    try {
      const res = await apiClient.get<ShiftSummary>(ENDPOINTS.DRIVERS.SHIFT.CURRENT);
      return res.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response?.data) return null;
      throw error;
    }
  },
  getWeeklyPerformance: async (): Promise<WeeklyPerformance> => {
    const res = await apiClient.get<WeeklyPerformance>(ENDPOINTS.DRIVERS.PERFORMANCE.WEEKLY);
    return res.data;
  },
  getBadges: async (): Promise<Badge[]> => {
    const res = await apiClient.get<Badge[]>(ENDPOINTS.DRIVERS.BADGES);
    return res.data;
  },
  getShiftGoals: async (): Promise<ShiftGoal[]> => {
    const res = await apiClient.get<ShiftGoal[]>(ENDPOINTS.DRIVERS.SHIFT.GOALS);
    return res.data;
  },
  endShift: async (id: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.DRIVERS.SHIFT.END(id));
  },
};

export default shiftService;
