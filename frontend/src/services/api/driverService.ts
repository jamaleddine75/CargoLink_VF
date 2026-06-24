import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface DriverDetails {
  id: string;
  firstName: string;
  lastName: string;
  vehiclePlate: string;
  vehicleType: string;
  driverStatus: string;
  agencyName?: string;
  agencyCity?: string;
  registrationCity?: string;
  phoneNumber?: string;
  verificationStatus?: string;
  rejectionReason?: string;
  licenseNumber?: string;
  documents?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  avatarUrl?: string;
  rating?: number;
  ratingCount?: number;
  loyaltyPoints?: number;
  disciplinaryStatus?: string;
  lastDisciplinaryReason?: string;
}

export interface DriverStats {
  assignedOrders: number;
  deliveredOrders: number;
  todayEarnings: number;
  pendingCod: number;
  weeklyCommission: number;
  successRate: number;
}

export interface DriverDashboardStats {
  todayDelivered: number;
  todayFailed: number;
  todayEarnings: number;
  lastOrderEarnings?: number;
  earningsTrend?: string;
  pendingCOD: number;
  weeklyCommission: number;
  successRate: number;
  activeOrderCount: number;
  isOnline: boolean;
  verificationStatus: string | null;
  loyaltyPoints?: number;
}

export interface DriverProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  documents?: string;
}

const driverService = {
  getProfile: async (): Promise<DriverDetails> => {
    const response = await apiClient.get<DriverDetails>(ENDPOINTS.DRIVERS.BASE + '/profile');
    return response.data;
  },

  getDriverDetails: async (id: string): Promise<DriverDetails> => {
    const response = await apiClient.get<DriverDetails>(ENDPOINTS.DRIVERS.BY_ID(id));
    return response.data;
  },

  getStats: async (period = 'today'): Promise<DriverStats> => {
    const response = await apiClient.get<DriverStats>(ENDPOINTS.DRIVERS.BASE + `/stats?period=${period}`);
    return response.data;
  },

  getDashboard: async (): Promise<DriverDashboardStats> => {
    const response = await apiClient.get<any>(ENDPOINTS.DRIVERS.BASE + '/dashboard');
    const raw = response.data ?? {};
    const toNumber = (v: any) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    let normalized: DriverDashboardStats = {
      todayDelivered: toNumber(raw.todayDelivered),
      todayFailed: toNumber(raw.todayFailed),
      todayEarnings: toNumber(raw.todayEarnings ?? raw.earnings),
      lastOrderEarnings: toNumber(raw.lastOrderEarnings),
      earningsTrend: raw.earningsTrend ?? 'Stable',
      pendingCOD: toNumber(raw.pendingCOD),
      weeklyCommission: toNumber(raw.weeklyCommission),
      successRate: toNumber(raw.successRate), // Backend already returns 0-100
      activeOrderCount: toNumber(raw.activeOrderCount),
      isOnline: Boolean(raw.isOnline),
      verificationStatus: raw.verificationStatus ?? null,
      loyaltyPoints: toNumber(raw.loyaltyPoints),
    };

    const looksEmpty =
      normalized.todayDelivered === 0 &&
      normalized.todayEarnings === 0 &&
      normalized.activeOrderCount === 0;

    if (looksEmpty) {
      try {
        const stats = await driverService.getStats('today');
        normalized = {
          ...normalized,
          todayDelivered: normalized.todayDelivered || toNumber(stats.deliveredOrders),
          todayEarnings: normalized.todayEarnings || toNumber(stats.todayEarnings),
          successRate: normalized.successRate || toNumber(stats.successRate),
        };
      } catch {
        // keep normalized dashboard as-is
      }
    }

    return normalized;
  },

  updateStatus: async (_driverId: string, status: string): Promise<DriverDetails> => {
    const response = await apiClient.patch<DriverDetails>(ENDPOINTS.DRIVERS.BASE + '/me/status', { status });
    return response.data;
  },

  updateProfile: async (payload: DriverProfileUpdatePayload): Promise<DriverDetails> => {
    const response = await apiClient.put<DriverDetails>(ENDPOINTS.DRIVERS.BASE + '/profile', payload);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.put<{ avatarUrl: string }>(ENDPOINTS.AUTH.UPDATE_AVATAR, form);
    return response.data;
  },

  uploadDocument: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<{ url: string }>('/drivers/documents/upload', form);
    return response.data;
  },

  updateDocuments: async (documents: Record<string, string>): Promise<DriverDetails> => {
    // We send this as part of updateProfile if supported, or via a specific endpoint
    // According to DriverController.java, updateProfile takes UpdateDriverProfileRequest
    // Let's check if documents is in UpdateDriverProfileRequest
    const response = await apiClient.put<DriverDetails>(ENDPOINTS.DRIVERS.BASE + '/profile', {
      documents: JSON.stringify(documents)
    });
    return response.data;
  },

  getAllDrivers: async (): Promise<DriverDetails[]> => {
    const response = await apiClient.get<DriverDetails[]>(ENDPOINTS.DRIVERS.BASE);
    return response.data;
  },

  updatePreferences: async (prefs: any): Promise<any> => {
    const response = await apiClient.patch(ENDPOINTS.DRIVERS.PREFERENCES, prefs);
    return response.data;
  },

  getPreferences: async (): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.DRIVERS.PREFERENCES);
    return response.data;
  },

  suspendDriver: async (id: string, reason: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.AGENCY_ADMIN.SUSPEND_DRIVER(id), { reason });
  },

  reactivateDriver: async (id: string, reason: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.AGENCY_ADMIN.REACTIVATE_DRIVER(id), { reason });
  },

  blacklistDriver: async (id: string, reason: string): Promise<void> => {
    await apiClient.put(ENDPOINTS.AGENCY_ADMIN.BLACKLIST_DRIVER(id), { reason });
  },

  getDriverDisciplinaryHistory: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(ENDPOINTS.AGENCY_ADMIN.DRIVER_HISTORY(id));
    return response.data;
  }
};

export default driverService;
