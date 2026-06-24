import { useQuery } from '@tanstack/react-query';
import orderService from '@/services/api/orderService';

export const useAvailableOrders = (page = 0, size = 20) =>
  useQuery({
    queryKey: ['driver', 'orders', 'available', page, size],
    queryFn: () => orderService.getAvailableOrders({ page, size }),
    staleTime: 10_000,
    refetchInterval: 20_000
  });
