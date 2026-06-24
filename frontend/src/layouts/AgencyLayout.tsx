import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { AgencyNavbar } from "@/components/agency/AgencyNavbar";
import { AgencyMobileNav } from "@/components/agency/AgencyMobileNav";
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AgencyLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans relative overflow-hidden text-foreground">
        {/* ── Ambient background — Unified aesthetic ── */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 mesh-gradient opacity-60" />
          <div className="absolute inset-0 grid-pattern opacity-40" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/5 dark:bg-sky-500/8 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/6 blur-[100px]" />
        </div>

        <AgencySidebar />
        
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
          <AgencyNavbar />
          <main className="flex-1 overflow-auto scrollbar-hide">
            <div className="p-4 sm:p-6 md:p-10 lg:p-12">
               <div className="max-w-[1600px] mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <Outlet />
                  </motion.div>
               </div>
            </div>
          </main>
        </div>
        <AgencyMobileNav />
      </div>
    </SidebarProvider>
  );
}
