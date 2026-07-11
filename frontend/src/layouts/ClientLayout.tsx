import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/AppSidebar";
import { CustomerMobileNav } from "@/components/client/CustomerMobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ClientLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground relative overflow-hidden">
        {/* Desktop/Tablet Sidebar */}
        <ClientSidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
          {/* Header / Top Bar for Mobile */}
          <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-6 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="flex flex-col">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider leading-none">Command Center</p>
                <h2 className="text-xs font-semibold tracking-tight text-foreground mt-1">{location.pathname.split('/').pop()?.replace('dashboard', 'Overview')}</h2>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bell className="w-4 h-4 text-primary" />
            </div>
          </header>

          {/* Main Content Area */}
          <main className={cn("flex-1 overflow-y-auto", isMobile ? "pt-20 pb-24 px-4" : "p-6 md:p-8")}>
            <div className="max-w-[1600px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </div>
          </main>

          <CustomerMobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ClientLayout;
