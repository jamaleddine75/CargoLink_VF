/**
 * DriverBottomNav.tsx — Dark glass floating bottom nav (mobile only)
 * Hidden on lg+ (desktop uses DriverSidebar instead)
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, Navigation, Wallet, User, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import orderService from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: Home,       path: '/driver/dashboard' },
  { id: 'orders',    label: 'Missions', icon: Package,    path: '/driver/orders'    },
  { id: 'scan',      label: 'Scan',     icon: QrCode,     path: '/driver/scan', center: true },
  { id: 'map',       label: 'Carte',    icon: Navigation, path: '/driver/routes'    },
  { id: 'wallet',    label: 'Argent',   icon: Wallet,     path: '/driver/wallet'    },
  { id: 'profile',   label: 'Compte',   icon: User,       path: '/driver/profile'   },
];

const HIDE_ON = ['/driver/routesmap', '/driver/routes', '/driver/delivery', '/driver/problem', '/driver/scan'];

const DriverBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  // Badge: reuse the same cache entry as useDriverDashboard to avoid extra requests
  const { data: activeOrders } = useQuery({
    queryKey: ['driver', 'orders', 'active'],
    queryFn: () => orderService.getDriverActiveOrders(),
    enabled: isDriver,
    staleTime: 15_000,
  });
  const activeBadge = activeOrders?.length ?? 0;

  const shouldHide = HIDE_ON.some(p => pathname.startsWith(p));
  if (shouldHide) return null;

  const isActive = (path: string) => {
    if (path === '/driver/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div className="driver-bottom-nav-wrap lg:hidden fixed bottom-6 left-4 right-4 z-[100]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="driver-bottom-nav glass rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-card"
      >
        {TABS.map(tab => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          const showBadge = tab.id === 'orders' && activeBadge > 0;

          if (tab.center) {
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/40 active:scale-95 transition-all border-4 border-background z-50 ring-2 ring-sky-500/20"
                aria-label={tab.label}
              >
                <Icon size={22} strokeWidth={2.5} />
              </motion.button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300',
                active ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground'
              )}
              aria-label={tab.label}
            >
              {active && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="transition-all duration-300" />
                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-background flex items-center justify-center"
                    >
                      <span className="text-[7px] font-black text-white leading-none">
                        {activeBadge > 9 ? '9+' : activeBadge}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[9px] font-bold mt-1 tracking-wider relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default DriverBottomNav;
