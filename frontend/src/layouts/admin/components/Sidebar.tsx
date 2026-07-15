import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  ShieldAlert,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/UserAvatar';
import adminService from '@/services/api/adminService';

export function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const users = await adminService.getPendingUsers();
        if (users?.length > 0) {
          setPendingUsersCount(users.length);
        } else {
          setPendingUsersCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch pending users count:", err);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin/dashboard') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Agency Management', path: '/admin/agencies' },
    { icon: Package, label: 'Order Management', path: '/admin/orders' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Truck, label: 'Driver Management', path: '/admin/drivers' },
    { icon: FinancialCenterPage ? DollarSign : DollarSign, label: 'Financial Center', path: '/admin/financial-center' },
    { icon: CreditCard, label: 'Pricing Management', path: '/admin/pricing' },
    { icon: ShieldAlert, label: 'COD Reconciliation', path: '/admin/audit-remittances' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-card transition-all duration-300">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Shield className="text-white w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <h2 className="font-semibold text-lg tracking-tight text-foreground truncate leading-none">CargoLink</h2>
            <p className="text-[10px] font-medium text-primary tracking-wide truncate mt-0.5">Admin Console</p>
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
              {menuItems.map((item) => {
                const active = isActivePath(item.path);
                const displayBadge = item.path === '/admin/users' ? pendingUsersCount : 0;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={active}
                      className={cn(
                        "h-10 rounded-lg transition-all duration-200 group relative overflow-hidden",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link to={item.path} className="flex items-center gap-3 w-full px-3 h-full">
                        <item.icon className={cn("w-4 h-4 shrink-0 transition-all duration-200",
                          active ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100")} />
                        <span className="group-data-[collapsible=icon]:hidden font-medium text-sm flex-1 tracking-tight">{item.label}</span>
                        {displayBadge > 0 && (
                          <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full text-center group-data-[collapsible=icon]:hidden animate-in zoom-in duration-300">
                            {displayBadge}
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
            <p className="text-[10px] text-muted-foreground truncate font-normal">Administrator</p>
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
