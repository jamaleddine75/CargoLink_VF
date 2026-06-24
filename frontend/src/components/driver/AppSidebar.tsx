import React from 'react';
import {
  LayoutDashboard,
  Package,
  Wallet,
  Bell,
  LogOut,
  MapIcon,
  History,
  UserCircle,
  Sun,
  Moon,
  ChevronRight,
  BarChart3,
  Truck,
  ChevronLeft,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import UserAvatar from '@/components/common/UserAvatar';

import { useDriverPendingCod } from '@/hooks/useDriverEarnings';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: pendingCodOrders } = useDriverPendingCod();
  const pendingCodCount = (pendingCodOrders || []).length;

  const items = [
    {
      title: "Tableau de Bord",
      url: "/driver/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Centre de Scan",
      url: "/driver/scan-all",
      icon: QrCode,
    },
    {
      title: "Shift Hub",
      url: "/driver/shifthub",
      icon: BarChart3,
    },
    {
      title: "Carte de Route",
      url: "/driver/routesmap",
      icon: MapIcon,
    },
    {
      title: "Mes Livraisons",
      url: "/driver/orders",
      icon: Package,
    },
    {
      title: "Historique",
      url: "/driver/history",
      icon: History,
    },
    {
      title: "Portefeuille",
      url: "/driver/wallet",
      icon: Wallet,
      badge: pendingCodCount > 0 ? String(pendingCodCount) : undefined
    },
    {
      title: "Notifications",
      url: "/driver/notifications",
      icon: Bell
    },
    {
      title: "Mon Profil",
      url: "/driver/profile",
      icon: UserCircle
    },
  ];

  const isActivePath = (url: string) => {
    if (url === '/driver/dashboard') return pathname === url;
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl transition-all duration-500">
      {/* Landing-page style top gradient strip */}
      <div className="h-[3px] w-full bg-hero-gradient group-data-[collapsible=icon]:hidden" />

      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0"
          >
            <Truck className="text-white w-6 h-6" />
          </motion.div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <h2 className="font-black text-xl tracking-tighter text-foreground truncate leading-none">CargoLink</h2>
            <p className="text-[9px] uppercase font-black text-primary tracking-[0.35em] truncate mt-0.5">Driver Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 scrollbar-hide no-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.25em] mb-2 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = isActivePath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={active} className={cn(
                      "h-12 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      active
                        ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-primary/25"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}>
                      <NavLink to={item.url} className="flex items-center gap-3 w-full px-3 h-full">
                        <item.icon className={cn("w-5 h-5 shrink-0 transition-all duration-300",
                          active ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
                        <span className="group-data-[collapsible=icon]:hidden font-bold text-sm flex-1 tracking-tight">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full text-center group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                        {!active && (
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300 group-data-[collapsible=icon]:hidden" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-border/50 bg-white/[0.02] backdrop-blur-xl p-3">
        <div className={cn(
          "bg-muted/40 rounded-2xl p-2.5 flex items-center gap-3 border border-border/50 shadow-sm transition-all duration-300",
          isCollapsed ? "flex-col p-1.5 bg-transparent border-transparent shadow-none" : "justify-between"
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
             <div className="relative shrink-0">
                <UserAvatar user={user} className="h-9 w-9 rounded-xl border-2 border-primary/20 shadow-md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
             </div>
             
             {!isCollapsed && (
               <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate leading-none mb-1">
                     {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[8px] font-bold text-primary uppercase tracking-[0.3em] truncate leading-none">
                     Driver
                  </p>
               </div>
             )}
          </div>
          
          {!isCollapsed ? (
             <div className="flex items-center gap-1">
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={toggleTheme}
                   className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                   {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </Button>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={toggleSidebar}
                   className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                   <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={logout}
                   className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                   <LogOut className="w-3.5 h-3.5" />
                </Button>
             </div>
          ) : (
            <div className="flex flex-col gap-3 items-center">
               <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
               >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
               <button 
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all"
               >
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
