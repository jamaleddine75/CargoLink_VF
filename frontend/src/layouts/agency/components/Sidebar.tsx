import React from 'react';
import {
  BarChart3,
  Truck,
  Package,
  Users,
  LogOut,
  LayoutDashboard,
  Bell,
  Wallet,
  ShieldCheck,
  Activity,
  Settings,
  FileText,
  Sun,
  Moon,
  ChevronRight,
  HeadphonesIcon
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
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import UserAvatar from '@/components/common/UserAvatar';
import notificationService from '@/services/api/notificationService';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/agency/dashboard' },
  { icon: Activity, label: 'Live Ops', path: '/agency/live-ops' },
  { icon: Package, label: 'Orders', path: '/agency/orders' },
  { icon: Users, label: 'Customers', path: '/agency/customers' },
  { icon: Truck, label: 'Drivers', path: '/agency/drivers' },
  { icon: Wallet, label: 'Wallet', path: '/agency/wallet' },
  { icon: FileText, label: 'COD Reconciliation', path: '/agency/cod-reconciliation' },
  { icon: BarChart3, label: 'Analytics', path: '/agency/analytics' },
  { icon: HeadphonesIcon, label: 'Support', path: '/agency/support' },
  { icon: Bell, label: 'Notifications', path: '/agency/notifications' },
  { icon: Settings, label: 'Settings', path: '/agency/settings' },
];

export function AgencySidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/agency/dashboard') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/60 bg-background/95 backdrop-blur-3xl shadow-card transition-all duration-500">
      {/* Landing-page style top gradient strip */}
      <div className="h-[3px] w-full bg-hero-gradient group-data-[collapsible=icon]:hidden" />

      <SidebarHeader className="p-5 pb-4">
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
            <p className="text-[9px] uppercase font-black text-primary tracking-[0.35em] truncate mt-0.5">Agency Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.25em] mb-2 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={active}
                      className={cn(
                        "h-12 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        active
                          ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-primary/25"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link to={item.path} className="flex items-center gap-3 w-full px-3 h-full">
                        <item.icon className={cn("w-5 h-5 shrink-0 transition-all duration-300",
                          active ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
                        <span className="group-data-[collapsible=icon]:hidden font-bold text-sm flex-1 tracking-tight">{item.label}</span>
                        {item.label === 'Notifications' && unreadCount > 0 && (
                          <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full text-center group-data-[collapsible=icon]:hidden">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        {!active && (
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300 group-data-[collapsible=icon]:hidden" />
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
        <div className="bg-accent/40 rounded-2xl p-3 flex items-center gap-3 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1 border border-border/50 shadow-sm">
          <UserAvatar user={user} className="h-10 w-10 border-2 border-primary/20 shadow-md shrink-0" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[12px] font-black truncate text-foreground leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[9px] text-muted-foreground/70 truncate font-medium">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme}
              className="rounded-lg w-8 h-8 hover:bg-background transition-all duration-300">
              {theme === 'dark'
                ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                : <Moon className="w-3.5 h-3.5 text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}
              className="rounded-lg w-8 h-8 hover:bg-rose-500/10 text-rose-500 transition-all duration-300">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
