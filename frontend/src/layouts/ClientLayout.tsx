import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/AppSidebar";
import { CustomerMobileNav } from "@/components/client/CustomerMobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

import { motion } from 'framer-motion';

const ClientLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground relative selection:bg-primary/20 selection:text-primary overflow-hidden">
        {/* ── Ambient background — Unified aesthetic ── */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 mesh-gradient opacity-40 dark:opacity-60" />
          <div className="absolute inset-0 grid-pattern opacity-20 dark:opacity-40" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/[0.03] dark:bg-sky-500/8 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] dark:bg-indigo-500/6 blur-[100px]" />
        </div>

        {/* Desktop/Tablet Sidebar */}
        <ClientSidebar />

        <SidebarInset className="flex-1 transition-all duration-300 bg-transparent relative">
          {/* Header / Top Bar for Mobile - High Quality */}
          <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Command Center</p>
                <h2 className="font-black text-xs tracking-tighter uppercase text-muted-foreground mt-1">{location.pathname.split('/').pop()?.replace('dashboard', 'Overview')}</h2>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bell className="w-4 h-4 text-primary" />
            </div>
          </header>

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto scrollbar-hide ${isMobile ? 'pt-16 pb-6 px-4' : 'p-4 sm:p-8 pb-12'}`}>
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </div>
          </main>

          <CustomerMobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ClientLayout;
