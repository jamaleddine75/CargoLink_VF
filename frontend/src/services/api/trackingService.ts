import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface TrackingHistory {
  id: string;
  orderId: string;
  status: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  timestamp: string;
}

const trackingService = {
  getTrackingHistory: async (orderId: string): Promise<TrackingHistory[]> => {
    const response = await apiClient.get<TrackingHistory[]>(ENDPOINTS.ORDERS.BY_TRACKING(orderId));
    return response.data;
  },

  updatePosition: async (orderId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.post(ENDPOINTS.ORDERS.BY_ID(orderId) + '/location', { lat, lng });
  }
};

export default trackingService;
