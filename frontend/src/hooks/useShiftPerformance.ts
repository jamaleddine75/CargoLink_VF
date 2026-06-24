import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import shiftService from '@/services/api/shiftService';
import { useAuth } from '@/context/AuthContext';

export const useShiftPerformance = () => {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const isDriver = isAuthenticated && (user?.role === 'DRIVER' || user?.role === 'LIVREUR');

  // ── Active shift (refreshes every 60s) ─────────────────────────────────────
  const shift = useQuery({
    queryKey: ['driver', 'shift', 'current'],
    queryFn: shiftService.getCurrentShift,
    enabled: isDriver,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ── Weekly perf (refreshes every 5 min) ────────────────────────────────────
  const weekly = useQuery({
    queryKey: ['driver', 'shift', 'weekly'],
    queryFn: shiftService.getWeeklyPerformance,
    enabled: isDriver,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ── Badges (refreshes every 10 min) ────────────────────────────────────────
  const badges = useQuery({
    queryKey: ['driver', 'badges'],
    queryFn: shiftService.getBadges,
    enabled: isDriver,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ── Goals (refreshes every 60s, same cadence as shift) ─────────────────────
  const goals = useQuery({
    queryKey: ['driver', 'shift', 'goals'],
    queryFn: shiftService.getShiftGoals,
    enabled: isDriver,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ── Start shift mutation ──────────────────────────────────────────────────────
  const startShiftMutation = useMutation({
    mutationFn: shiftService.startShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver', 'shift', 'current'] });
      toast.success('Shift démarré avec succès ! 🚀');
    },
    onError: () => {
      toast.error('Erreur lors du démarrage du shift');
    },
  });

  // ── End shift mutation ──────────────────────────────────────────────────────
  const endShiftMutation = useMutation({
    mutationFn: (shiftId: string) => shiftService.endShift(shiftId),
    onSuccess: () => {
      // Invalidate everything driver-related after ending shift
      qc.invalidateQueries({ queryKey: ['driver'] });
      toast.success('Shift terminé — bonne journée ! 👋');
    },
    onError: () => {
      toast.error('Erreur lors de la clôture du shift');
    },
  });

  const isLoading = shift.isLoading || weekly.isLoading;

  return {
    shift,
    weekly,
    badges,
    goals,
    startShiftMutation,
    endShiftMutation,
    isLoading,
  };
};
