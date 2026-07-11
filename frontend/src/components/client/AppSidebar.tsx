import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle,
  Bell, 
  Settings,
  LogOut,
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  Sun,
  Moon
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
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import UserAvatar from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';
import { useTheme } from "@/components/ThemeProvider";

const items = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create Order",
    url: "/client/create-order",
    icon: PlusCircle,
  },
  {
    title: "My Orders",
    url: "/client/orders",
    icon: Package,
  },
  {
    title: "Track Orders",
    url: "/client/track-orders",
    icon: MapPin,
  },
  {
    title: "Wallet",
    url: "/client/wallet",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    url: "/client/notifications",
    icon: Bell,
  },
];

export function ClientSidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActivePath = (path: string) => {
    if (path === '/client/dashboard') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-card transition-all duration-300">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <User className="text-white w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <h2 className="font-semibold text-lg tracking-tight text-foreground truncate leading-none">CargoLink</h2>
            <p className="text-[10px] font-medium text-primary tracking-wide truncate mt-0.5">Customer Portal</p>
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
                const isNotifications = item.title === "Notifications";
                const displayBadge = isNotifications ? unreadCount : 0;
                
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
                        {displayBadge > 0 && (
                          <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full text-center group-data-[collapsible=icon]:hidden">
                            {displayBadge > 9 ? '9+' : displayBadge}
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

        <SidebarSeparator className="my-4 opacity-5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground mb-2 group-data-[collapsible=icon]:hidden">
            Account
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Settings"
                isActive={isActivePath('/client/settings')}
                className={cn(
                  "h-10 rounded-lg transition-all duration-200 group relative overflow-hidden",
                  isActivePath('/client/settings')
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Link to="/client/settings" className="flex items-center gap-3 w-full px-3 h-full">
                  <Settings className={cn("w-4 h-4 shrink-0 transition-all duration-200",
                    isActivePath('/client/settings') ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100")} />
                  <span className="group-data-[collapsible=icon]:hidden font-medium text-sm flex-1 tracking-tight">Settings</span>
                  {!isActivePath('/client/settings') && (
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-200 group-data-[collapsible=icon]:hidden" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1 border border-border shadow-sm">
          <UserAvatar user={user} className="h-9 w-9 border border-border shadow-sm shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold truncate text-foreground leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate font-normal">Customer</p>
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
