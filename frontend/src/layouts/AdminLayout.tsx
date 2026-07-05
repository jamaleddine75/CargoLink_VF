import React from 'react';
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Outlet } from 'react-router-dom';
import { DashboardTopbar } from "@/components/common/DashboardTopbar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

import { motion, AnimatePresence } from 'framer-motion';

function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      {/* ── Ambient background — Unified aesthetic ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-40 dark:opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-20 dark:opacity-40" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/[0.03] dark:bg-sky-500/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] dark:bg-indigo-500/6 blur-[100px]" />
      </div>

      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <DashboardTopbar title="Admin Dashboard" />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
      
      <AdminMobileNav />
    </div>
  );
}

export default AdminLayout;
