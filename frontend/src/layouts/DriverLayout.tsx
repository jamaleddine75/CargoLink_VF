/**
 * DriverLayout.tsx
 * Responsive driver shell:
 *   Mobile  (<lg): full-width + bottom nav
 *   Desktop (≥lg): fixed 80px sidebar + content offset
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import DriverNotificationHandler from '@/components/driver/DriverNotificationHandler';
import DriverBottomNav from '@/components/driver/DriverBottomNav';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/driver/AppSidebar';
import RegionGuard from '@/components/driver/RegionGuard';
import { motion, AnimatePresence } from 'framer-motion';

/** Routes where sidebar + bottom nav are completely hidden */
const FULLSCREEN_PATHS = ['/driver/routesmap', '/driver/routes', '/driver/delivery/', '/driver/problem'];

const DriverLayout: React.FC = () => {
  const { pathname } = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const isFullscreen = FULLSCREEN_PATHS.some(p => pathname.includes(p));

  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <RegionGuard>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground relative">
          {/* ── Ambient background — mirrors landing page aesthetic ── */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 mesh-gradient opacity-60" />
            <div className="absolute inset-0 grid-pattern opacity-40" />
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/5 dark:bg-sky-500/8 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/6 blur-[100px]" />
          </div>
          {/* ── Offline banner ── */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ y: -48, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={{   y: -48, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] h-12 bg-rose-500 text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg"
              >
                <WifiOff size={14} />
                Connexion Perdue
              </motion.div>
            )}
          </AnimatePresence>

          {isFullscreen ? (
            /* ── Fullscreen map / delivery pages ── */
            <ErrorBoundary>
              <main className="flex-1 relative">
                <Outlet />
              </main>
              <DriverNotificationHandler />
            </ErrorBoundary>
          ) : (
            <>
              {/* ── Desktop Sidebar ── */}
              <AppSidebar />

              {/* ── Page content ── */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <ErrorBoundary>
                  <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:px-[clamp(24px,3vw,48px)]">
                      <Outlet />
                    </div>
                  </main>
                </ErrorBoundary>

                {/* ── Mobile bottom nav (hidden on desktop via CSS in component) ── */}
                <DriverBottomNav />

                {/* ── Global incoming order popup ── */}
                <DriverNotificationHandler />
              </div>
            </>
          )}
        </div>
      </SidebarProvider>
    </RegionGuard>
  );
};

export default DriverLayout;
