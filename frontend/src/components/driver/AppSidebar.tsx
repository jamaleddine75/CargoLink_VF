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
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import UserAvatar from '@/components/common/UserAvatar';

import { useDriverPendingCod } from '@/hooks/useDriverEarnings';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { data: pendingCodOrders } = useDriverPendingCod();
  const pendingCodCount = (pendingCodOrders || []).length;

  const items = [
    {
      title: "Dashboard",
      url: "/driver/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Route Map",
      url: "/driver/routes",
      icon: MapIcon,
    },
    {
      title: "My Deliveries",
      url: "/driver/orders",
      icon: Package,
    },
    {
      title: "History",
      url: "/driver/history",
      icon: History,
    },
    {
      title: "Wallet",
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
      title: "My Profile",
      url: "/driver/profile",
      icon: UserCircle
    },
  ];

  const isActivePath = (url: string) => {
    if (url === '/driver/dashboard') return pathname === url;
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-card transition-all duration-300">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Truck className="text-white w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <h2 className="font-semibold text-lg tracking-tight text-foreground truncate leading-none">CargoLink</h2>
            <p className="text-[10px] font-medium text-primary tracking-wide truncate mt-0.5">Driver Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground mb-2 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = isActivePath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className={cn(
                        "h-10 rounded-lg transition-all duration-200 group relative overflow-hidden",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-3 w-full px-3 h-full">
                        <item.icon className={cn("w-4 h-4 shrink-0 transition-all duration-200",
                          active ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100")} />
                        <span className="group-data-[collapsible=icon]:hidden font-medium text-sm flex-1 tracking-tight">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full text-center group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                        {!active && (
                          <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-200 group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1 border border-border shadow-sm">
          <UserAvatar user={user} className="h-9 w-9 border border-border shadow-sm shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold truncate text-foreground leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate font-normal">Driver</p>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme}
              className="rounded-lg w-8 h-8 hover:bg-background transition-all duration-200">
              {theme === 'dark'
                ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                : <Moon className="w-3.5 h-3.5 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}
              className="rounded-lg w-8 h-8 hover:bg-rose-500/10 text-rose-500 transition-all duration-200">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
