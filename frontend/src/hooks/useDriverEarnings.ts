import { useQuery } from '@tanstack/react-query';
import driverWalletService from '@/services/api/driverWalletService';

export const useDriverEarnings = (page = 0, type = 'all', period = 'all') =>
  useQuery({
    queryKey: ['driver', 'wallet', 'transactions', page, type, period],
    queryFn: () => driverWalletService.getTransactions(page, 20, type, period),
    staleTime: 60_000
  });

export const useDriverWalletBalance = () =>
  useQuery({
    queryKey: ['driver', 'wallet', 'balance'],
    queryFn: () => driverWalletService.getBalance(),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

export const useDriverPendingCod = () =>
  useQuery({
    queryKey: ['driver', 'wallet', 'pending-cod'],
    queryFn: () => driverWalletService.getPendingCod(),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

export const useDriverDailyEarnings = (days = 7) =>
  useQuery({
    queryKey: ['driver', 'wallet', 'daily-earnings', days],
    queryFn: () => driverWalletService.getDailyEarnings(days),
    staleTime: 60_000
  });
