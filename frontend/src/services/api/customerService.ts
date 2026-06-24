import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Order, PagedResponse } from '../../types';

export interface ClientKPIs {
  totalSent: number;
  inTransit: number;
  delivered: number;
  pendingPayment: number;
}

const customerService = {
  getKPIs: async (clientId: string): Promise<ClientKPIs> => {
    const response = await apiClient.get<ClientKPIs>(ENDPOINTS.ORDERS.CLIENT_KPIS(clientId));
    return response.data;
  },

  getRecentOrders: async (page = 0, size = 5): Promise<PagedResponse<Order>> => {
    // Correctly using /orders endpoint (via ENDPOINTS.ORDERS.BASE)
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.ORDERS.BASE, {
      params: { page, size }
    });
    return response.data;
  }
};

export default customerService;
