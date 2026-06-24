import { useQuery } from '@tanstack/react-query';
import orderService from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';

export const useActiveDelivery = (orderId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  const query = useQuery({
    queryKey: ['driver', 'order', orderId],
    queryFn: async () => {
      try {
        const data = await orderService.getOrderById(orderId!);
        // Cache successful result for offline access
        if (data) {
          localStorage.setItem(`delivery_cache_${orderId}`, JSON.stringify(data));
        }
        return data;
      } catch (err) {
        // Fallback to cache if offline
        const cached = localStorage.getItem(`delivery_cache_${orderId}`);
        if (cached) {
          console.warn('Offline: Using cached delivery data');
          return JSON.parse(cached);
        }
        throw err;
      }
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
    enabled: !!orderId && isDriver
  });

  return query;
};
