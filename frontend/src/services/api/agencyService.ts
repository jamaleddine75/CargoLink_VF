import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Order, PagedResponse, Driver } from '../../types';

export interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface AgencyMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeDrivers: number;
  pendingPickups: number;
  ongoingDeliveries: number;
  issuesCount: number;
  walletBalance: number;
  pendingCOD: number;
  weeklyOrders: Array<{date: string, count: number}>;
  driversStatus: Array<{name: string, value: number, color: string}>;
}

const agencyService = {
  getAgencies: async (): Promise<Agency[]> => {
    const response = await apiClient.get<Agency[]>(ENDPOINTS.AGENCIES.BASE);
    return response.data;
  },

  getAgencyById: async (id: string): Promise<Agency> => {
    const response = await apiClient.get<Agency>(ENDPOINTS.AGENCIES.BY_ID(id));
    return response.data;
  },

  getAgencyMetrics: async (id: string): Promise<AgencyMetrics> => {
    const response = await apiClient.get<AgencyMetrics>(ENDPOINTS.AGENCIES.METRICS(id));
    return response.data;
  },

  getAgencyDrivers: async (id: string): Promise<Driver[]> => {
    const response = await apiClient.get<Driver[]>(ENDPOINTS.AGENCIES.DRIVERS(id));
    return response.data;
  },

  getAgencyOrders: async (id: string, page = 0, size = 10): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.AGENCIES.ORDERS(id), {
      params: { page, size }
    });
    return response.data;
  },

  getAgencyIncidents: async (agencyId: string): Promise<unknown[]> => {
    const response = await apiClient.get<unknown[]>(`/incidents/agency/${agencyId}`);
    return response.data;
  },

  getPendingRemittances: async (agencyId: string): Promise<unknown[]> => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.PENDING_REMITTANCES(agencyId));
    return response.data;
  },

  confirmRemittance: async (agencyId: string, transactionId: string): Promise<unknown> => {
    const response = await apiClient.post(ENDPOINTS.AGENCIES.CONFIRM_REMITTANCE(agencyId, transactionId));
    return response.data;
  },

  getAdminOrders: async (status?: string, page = 0, size = 10): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.AGENCY_ADMIN.ORDERS, {
      params: { status, page, size }
    });
    return response.data;
  },

  getAdminDrivers: async (): Promise<Driver[]> => {
    const response = await apiClient.get<Driver[]>(ENDPOINTS.AGENCY_ADMIN.DRIVERS);
    return response.data;
  },

  confirmPayment: async (orderId: string): Promise<unknown> => {
    const response = await apiClient.put(ENDPOINTS.AGENCY_ADMIN.CONFIRM_PAYMENT(orderId));
    return response.data;
  },

  exportCOD: async (agencyId: string, params: { status?: string; startDate?: string; endDate?: string; format: 'csv' | 'pdf' }): Promise<void> => {
    const response = await apiClient.get(`/agencies/${agencyId}/cod-export`, {
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cod_reconciliation_${agencyId}.${params.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getSettings: async (): Promise<unknown> => {
    const response = await apiClient.get('/agency/settings');
    return response.data;
  },

  updateSettings: async (settings: unknown): Promise<void> => {
    await apiClient.put('/agency/settings', settings);
  },

  createOrder: async (orderData: unknown): Promise<Order> => {
    const response = await apiClient.post<Order>(ENDPOINTS.AGENCY_ADMIN.ORDERS, orderData);
    return response.data;
  },

  extendWorkPermission: async (driverId: string): Promise<Driver> => {
    const response = await apiClient.put<Driver>(ENDPOINTS.AGENCY_ADMIN.EXTEND_PERMISSION(driverId));
    return response.data;
  },

  getPayoutRequests: async (): Promise<unknown[]> => {
    const response = await apiClient.get('/wallet/agency/payout-requests');
    return response.data;
  },

  getOrdersByCity: async (city: string, type?: 'pickup' | 'delivery', status?: string, page = 0, size = 10): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.AGENCY_ADMIN.ORDERS, {
      params: { 
        city,
        type,
        status,
        page,
        size
      }
    });
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(ENDPOINTS.AGENCY_ADMIN.ORDERS_BY_ID(orderId));
    return response.data;
  },
};

export default agencyService;
