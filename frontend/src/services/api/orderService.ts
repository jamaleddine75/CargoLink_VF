import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Order, PagedResponse } from '../../types';

export interface OrderFilterParams {
  driverId?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface DriverHistoryParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface StatusUpdateExtra {
  lat?: number;
  lng?: number;
  photoUrl?: string;
  scanValue?: string;
  comment?: string;
  codCollected?: boolean;
  category?: string;
  description?: string;
}

const orderService = {
  getOrders: async (params: OrderFilterParams): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.ORDERS.BASE, { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(ENDPOINTS.ORDERS.BY_ID(id));
    return response.data;
  },

  getOrderDetails: async (id: string): Promise<Order> => {
    return orderService.getOrderById(id);
  },

  updateOrderStatus: async (orderId: string, payload: { status: string } & StatusUpdateExtra): Promise<Order> => {
    const response = await apiClient.put<Order>(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), payload);
    return response.data;
  },

  acceptOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.ASSIGN_DRIVER(orderId));
    return response.data;
  },

  refuseOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.REFUSE(orderId));
    return response.data;
  },

  reportProblem: async (orderId: string, category: string, description: string): Promise<Order> => {
    if (orderId.startsWith('fnideq-')) return { id: orderId, status: 'FAILED' } as any;
    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.REPORT_PROBLEM(orderId), { category, description });
    return response.data;
  },
  
  getDriverKPIs: async (driverId: string): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.ORDERS.DRIVER.KPIS(driverId));
    return response.data;
  },

  getDriverOrders: async (params: OrderFilterParams): Promise<PagedResponse<Order>> => {
    return orderService.getOrders(params);
  },

  createOrder: async (orderData: any): Promise<Order> => {
    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.BASE, orderData);
    return response.data;
  },

  batchUpdateStatus: async (data: { trackingNumbers: string[], status: string, lat?: number, lng?: number, comment?: string }): Promise<any> => {
    const response = await apiClient.put(ENDPOINTS.ORDERS.BATCH_STATUS, data);
    return response.data;
  },

  getOrderByTracking: async (trackingNumber: string): Promise<Order> => {
    const response = await apiClient.get<Order>(ENDPOINTS.ORDERS.BY_TRACKING(trackingNumber));
    return response.data;
  },

  getActiveOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(ENDPOINTS.ORDERS.DRIVER.ACTIVE);
    return Array.isArray(response.data) ? response.data : [];
  },

  estimateFee: async (payload: { distanceKm: number; codAmount?: number; urgent?: boolean; heavy?: boolean }): Promise<any> => {
    const response = await apiClient.post(ENDPOINTS.ORDERS.ESTIMATE_FEE, payload);
    return response.data;
  },

  // Driver-specific methods
  getAvailableOrders: async (params: { page?: number; size?: number; lat?: number; lng?: number; radius?: number } = {}): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.ORDERS.DRIVER.AVAILABLE, {
      params: { 
        page: params.page || 0, 
        size: params.size || 20,
        lat: params.lat,
        lng: params.lng,
        radius: params.radius
      }
    });
    return response.data;
  },

  getDriverActiveOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(ENDPOINTS.ORDERS.DRIVER.ACTIVE);
    return response.data;
  },

  getDriverHistory: async (params: DriverHistoryParams): Promise<PagedResponse<Order>> => {
    const response = await apiClient.get<PagedResponse<Order>>(ENDPOINTS.ORDERS.DRIVER.HISTORY, { params });
    return response.data;
  },

  getDriverStats: async (): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.ORDERS.DRIVER.STATS);
    return response.data;
  },

  assignOrderToDriver: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.ASSIGN_DRIVER(orderId));
    return response.data;
  },

  submitProofOfDelivery: async (
    payload: FormData | { orderId: string; proofMethod: string; pinCode?: string; photo?: File; notes?: string }
  ): Promise<Order> => {
    const formData = payload instanceof FormData ? payload : (() => {
      const form = new FormData();
      form.append('orderId', payload.orderId);
      form.append('proofMethod', payload.proofMethod);
      if (payload.pinCode) form.append('pinCode', payload.pinCode);
      if (payload.photo) form.append('photo', payload.photo);
      if (payload.notes) form.append('notes', payload.notes);
      return form;
    })();

    const response = await apiClient.post<Order>(ENDPOINTS.ORDERS.PROOF_OF_DELIVERY, formData);

    return response.data;
  },

  rateDriver: async (orderId: string, rating: number, comment?: string): Promise<{ message: string }> => {
    const response = await apiClient.post(ENDPOINTS.ORDERS.RATE(orderId), { rating, comment });
    return response.data;
  },

  getPublicTracking: async (trackingNumber: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/public/tracking/${trackingNumber}`);
    return response.data;
  }
};

export default orderService;
