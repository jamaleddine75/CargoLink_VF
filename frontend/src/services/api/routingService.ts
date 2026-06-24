import apiClient from '../../api/client';
import { ENDPOINTS } from '@/api/endpoints';

const routingService = {
  batchOptimize: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/routing/batch-optimise');
    return response.data;
  },
  
  getDriverRoute: async (driverId: string) => {
    const response = await apiClient.get(ENDPOINTS.ROUTING.DRIVER_ROUTE(driverId));
    return response.data;
  },

  reoptimizeRoute: async (driverId: string, payload: { orderIds: string[], currentLat: number, currentLng: number }) => {
    const response = await apiClient.post(ENDPOINTS.ROUTING.REOPTIMIZE(driverId), payload);
    return response.data;
  },

  reorderRoute: async (driverId: string, orderedStopIds: string[]) => {
    const response = await apiClient.put(ENDPOINTS.ROUTING.REORDER(driverId), { orderedStopIds });
    return response.data;
  },

  completePickup: async (orderId: string, payload: { lat: number, lng: number }) => {
    // validateStatus:()=>true prevents the global 401 interceptor from firing —
    // the routing endpoint may not be reachable; callers fall back to a plain status update.
    const response = await apiClient.post(ENDPOINTS.ROUTING.COMPLETE_PICKUP(orderId), payload, {
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw Object.assign(new Error(`completePickup ${response.status}`), { response });
  },

  completeDelivery: async (orderId: string, payload: { lat: number, lng: number, codCollected: boolean, proofType: string }) => {
    const response = await apiClient.post(ENDPOINTS.ROUTING.COMPLETE_DELIVERY(orderId), payload, {
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw Object.assign(new Error(`completeDelivery ${response.status}`), { response });
  },

  getETACascade: async (driverId: string) => {
    // validateStatus:()=>true prevents the global 401 interceptor from firing
    // for this optional polling call — a missing/inactive route is not a session error
    const response = await apiClient.get(ENDPOINTS.ROUTING.ETA_CASCADE(driverId), {
      validateStatus: () => true,
    });
    return response.status >= 200 && response.status < 300 ? response.data : null;
  },

  getTourStats: async (driverId: string) => {
    const response = await apiClient.get(ENDPOINTS.ROUTING.TOUR_STATS(driverId), {
      validateStatus: () => true,
    });
    return response.status >= 200 && response.status < 300 ? response.data : null;
  },

  optimizeDriverRoute: async (driverId: string, orderIds: string[]): Promise<string[]> => {
    const response = await apiClient.post(`/routing/optimise-driver/${driverId}`, orderIds);
    return response.data;
  },

  getClusters: async (count: number = 5): Promise<Record<number, string[]>> => {
    const response = await apiClient.get('/routing/clusters', { params: { count } });
    return response.data;
  },

  getETA: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<{ durationMinutes: number }> => {
    const response = await apiClient.get('/routing/eta', { params: { startLat, startLng, endLat, endLng } });
    return response.data;
  }
};

export default routingService;
