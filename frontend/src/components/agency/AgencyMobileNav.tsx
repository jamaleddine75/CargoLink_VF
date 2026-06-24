import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Plus, 
  Wallet,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgencyMobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/agence/dashboard' },
    { icon: Users, label: 'Drivers', path: '/agence/drivers' },
    { icon: Plus, label: 'New', path: '/agence/orders', center: true },
    { icon: Package, label: 'Orders', path: '/agence/orders' },
    { icon: Wallet, label: 'Wallet', path: '/agence/wallet' },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.center) {
            return (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-14 h-14 -mt-8 rounded-full bg-hero-gradient text-white shadow-lg shadow-primary/40 active:scale-95 transition-all border-4 border-background z-50"
              >
                <Icon size={22} strokeWidth={2.5} />
              </motion.button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all duration-300",
                active ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="agencyNavActive"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </motion.div>
    </div>
  );
}
