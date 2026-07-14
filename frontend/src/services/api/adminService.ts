import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Driver } from '../../types';

export interface MonthlyRevenue {
  name: string;
  revenue: number;
  orders: number;
}

export interface AgencyBreakdown {
  id: string;
  name: string;
  orders: number;
  commission: number;
  drivers: number;
}

export interface AdminStats {
  totalAgencies: number;
  totalDrivers: number;
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  ordersToday?: number;
  driversOnline?: number;
  activeDeliveries?: number;
  activeOrders?: number;
  monthlyRevenue: MonthlyRevenue[];
  agencyBreakdown: AgencyBreakdown[];
  pendingPayouts: number;
  systemHealth: {
    activeConnections: number;
    averageResponseTime: number;
    uptime: number;
  };
}

export interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
  adminAgencyName?: string;
  commissionRate: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  drivers?: number;
  driversCount?: number;
  totalOrders: number;
  totalRevenue: number;
  
  // New Fields matching backend
  code?: string;
  sector?: string;
  agencyType?: string;
  description?: string;
  maxDrivers?: number;
  maxDailyOrders?: number;
  openingHour?: string;
  closingHour?: string;
  workingDays?: string;
  managerSalary?: number;
  managerBonus?: number;
  autoDispatch?: boolean;
  maxConcurrentDeliveries?: number;
  maxEmployees?: number;
  operationalStatus?: string;
  notes?: string;
}


const adminService = {
  // ── Stats ──────────────────────────────────────────────────────────────────

  getGlobalStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>(ENDPOINTS.ADMIN.STATS);
    return response.data;
  },

  getDashboardStats: async (): Promise<unknown> => {
    const response = await apiClient.get('/admin/dashboard-stats');
    return response.data;
  },

  getTaskAnalytics: async (period = 'DAILY'): Promise<unknown> => {
    const response = await apiClient.get('/admin/analytics/tasks', { params: { period } });
    return response.data;
  },

  getSystemHealth: async (): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.SYSTEM_HEALTH);
    return response.data;
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  getAllUsers: async (
    page = 0,
    size = 10,
    role?: string,
    status?: string,
    search?: string
  ): Promise<unknown> => {
    const response = await apiClient.get('/admin/users', {
      params: {
        page,
        size,
        role: role && role !== 'ALL' ? role : undefined,
        status: status && status !== 'ALL' ? status : undefined,
        search: search || undefined,
      },
    });
    return response.data;
  },

  getPendingUsers: async (): Promise<unknown[]> => {
    const response = await apiClient.get('/admin/users', {
      params: { status: 'PENDING', page: 0, size: 100 },
    });
    return response.data?.content || [];
  },

  activateUser: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/approve/${userId}`);
  },

  rejectUser: async (userId: string, reason?: string): Promise<void> => {
    await apiClient.put(`/admin/reject/${userId}`, null, {
      params: { reason: reason || undefined },
    });
  },

  suspendUser: async (userId: string, suspend = true): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/suspend`, { suspend });
  },

  blacklistUser: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/blacklist`);
  },

  unblacklistUser: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/unblacklist`);
  },

  deleteUser: async (userId: string, hard = false): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`, { params: { hard } });
  },

  searchGlobal: async (q: string): Promise<unknown[]> => {
    const response = await apiClient.get('/admin/search', { params: { q } });
    return Array.isArray(response.data) ? response.data : [];
  },

  // ── Orders ─────────────────────────────────────────────────────────────────

  getOrders: async (params?: {
    status?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<unknown> => {
    const response = await apiClient.get('/admin/orders', { params });
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<unknown> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  assignOrder: async (orderId: string, driverId: string): Promise<unknown> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/assign-driver`, null, {
      params: { driverId },
    });
    return response.data;
  },

  assignDriverToOrder: async (orderId: string, driverId: string): Promise<unknown> => {
    return adminService.assignOrder(orderId, driverId);
  },

  reassignOrder: async (
    orderId: string,
    driverId: string,
    reason?: string,
    notes?: string
  ): Promise<unknown> => {
    const response = await apiClient.put(ENDPOINTS.ADMIN.REASSIGN_ORDER(orderId), {
      driverId,
      reason,
      notes,
    });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await apiClient.put(`/admin/orders/${orderId}/status`, null, { params: { status } });
  },

  // ── Agencies ───────────────────────────────────────────────────────────────

  getAllAgencies: async (page = 0, size = 20): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.BASE, {
      params: { page, size },
    });
    if (Array.isArray(response.data)) {
      const start = page * size;
      const content = response.data.slice(start, start + size);
      return {
        content,
        currentPage: page,
        pageSize: size,
        totalElements: response.data.length,
        totalPages: Math.max(1, Math.ceil(response.data.length / size)),
      };
    }
    return response.data;
  },

  getAgency: async (id: string): Promise<Agency> => {
    const response = await apiClient.get<Agency>(ENDPOINTS.AGENCIES.BY_ID(id));
    return response.data;
  },

  getAgencyMetrics: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/admin/agencies/${id}/metrics`);
    return response.data;
  },

  suspendAgency: async (id: string, reason?: string): Promise<unknown> => {
    const response = await apiClient.patch(ENDPOINTS.AGENCIES.BY_ID(id) + '/suspend', { reason });
    return response.data;
  },

  activateAgency: async (id: string): Promise<unknown> => {
    const response = await apiClient.patch(ENDPOINTS.AGENCIES.BY_ID(id) + '/activate');
    return response.data;
  },

  setCommissionRate: async (agencyId: string, rate: number): Promise<unknown> => {
    const response = await apiClient.put(
      ENDPOINTS.AGENCIES.BY_ID(agencyId) + '/commission-rate',
      { commissionRate: rate }
    );
    return response.data;
  },

  hideAgency: async (agencyId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.AGENCIES.BY_ID(agencyId) + '/hide');
  },

  updateAgencyCity: async (agencyId: string, city: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.AGENCIES.BY_ID(agencyId) + '/city', { city });
  },

  resetAgencyPassword: async (agencyId: string): Promise<void> => {
    await apiClient.post(`/admin/agencies/${agencyId}/reset-password`);
  },

  updateAgency: async (agencyId: string, data: unknown): Promise<Agency> => {
    const response = await apiClient.put<Agency>(`/admin/agencies/${agencyId}`, data);
    return response.data;
  },

  // ── Drivers ────────────────────────────────────────────────────────────────

  getDrivers: async (): Promise<Driver[]> => {
    try {
      const response = await apiClient.get('/admin/drivers');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404 || (typeof status === 'number' && status >= 500)) {
        const fallback = await apiClient.get('/drivers');
        return Array.isArray(fallback.data) ? fallback.data : [];
      }
      throw error;
    }
  },

  getLiveDrivers: async (): Promise<unknown[]> => {
    const response = await apiClient.get('/admin/live-drivers');
    return Array.isArray(response.data) ? response.data : [];
  },

  getGlobalLiveDrivers: async (agencyId?: string): Promise<unknown[]> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.LIVE_DRIVERS);
    const drivers = Array.isArray(response.data) ? response.data : [];
    if (!agencyId) return drivers;
    return drivers.filter(
      (d: any) => String(d?.agencyId || d?.agency?.id || '') === String(agencyId)
    );
  },

  getGlobalLiveOrders: async (agencyId?: string): Promise<unknown[]> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.ORDERS, {
      params: { status: 'ON_THE_WAY', page: 0, size: 100 },
    });
    const content = response.data?.content || [];
    if (!agencyId) return content;
    return content.filter(
      (o: any) => String(o?.agencyId || o?.agency?.id || '') === String(agencyId)
    );
  },

  // ── Wallets & Payouts ──────────────────────────────────────────────────────

  getAllWallets: async (page = 0, size = 20): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.WALLET.BASE + '/all', {
      params: { page, size },
    });
    return response.data;
  },

  getAgencyWallet: async (agencyId: string): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.WALLET(agencyId));
    return response.data;
  },

  getDriverWallet: async (driverId: string): Promise<unknown> => {
    try {
      const response = await apiClient.get(`/wallets/${driverId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  getWithdrawalRequests: async (page = 0, size = 10): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.WITHDRAWALS, {
      params: { page, size },
    });
    return response.data;
  },

  updateWithdrawalStatus: async (
    requestId: string,
    status: string,
    reason?: string
  ): Promise<unknown> => {
    const response = await apiClient.put(
      ENDPOINTS.ADMIN.UPDATE_WITHDRAWAL_STATUS(requestId),
      reason ? `${status}:${reason}` : status
    );
    return response.data;
  },

  getAllPayoutRequests: async (page = 0, size = 20, status?: string): Promise<unknown> => {
    const response = await apiClient.get('/admin/system/payouts', {
      params: { page, size, status },
    });
    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        currentPage: page,
        pageSize: size,
        totalElements: response.data.length,
        totalPages: 1,
      };
    }
    return response.data;
  },

  approvePayout: async (id: string): Promise<unknown> => {
    const response = await apiClient.put(
      ENDPOINTS.ADMIN.UPDATE_WITHDRAWAL_STATUS(id),
      'COMPLETED'
    );
    return response.data;
  },

  rejectPayout: async (id: string, reason: string): Promise<unknown> => {
    const response = await apiClient.put(
      ENDPOINTS.ADMIN.UPDATE_WITHDRAWAL_STATUS(id),
      `REJECTED:${reason}`
    );
    return response.data;
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  getSettings: async (): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.SETTINGS);
    return response.data;
  },

  updateSettings: async (settings: Record<string, unknown>): Promise<unknown> => {
    const response = await apiClient.put(ENDPOINTS.ADMIN.SETTINGS, settings);
    return response.data;
  },

  setPricingConfig: async (config: unknown): Promise<unknown> => {
    const response = await apiClient.put(ENDPOINTS.ADMIN.SETTINGS, config);
    return response.data;
  },

  getCurrentPricingConfig: async (): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.PRICING.CURRENT);
    return response.data;
  },

  updatePricingConfig: async (config: unknown): Promise<unknown> => {
    const response = await apiClient.post(ENDPOINTS.ADMIN.PRICING.UPDATE, config);
    return response.data;
  },

  // ── Notifications & Logs ───────────────────────────────────────────────────

  broadcastNotification: async (payload: {
    title: string;
    message: string;
    targetRoles: string[];
  }): Promise<unknown> => {
    const response = await apiClient.post(ENDPOINTS.ADMIN.BROADCAST, payload);
    return response.data;
  },

  getAuditLogs: async (params?: {
    date?: string;
    action?: string;
    actor?: string;
    page?: number;
    size?: number;
  }): Promise<unknown> => {
    const response = await apiClient.get(ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
    return response.data;
  },
};

export default adminService;
