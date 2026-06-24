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
  Layout,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
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
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from "@/components/ThemeProvider";

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/agency/dashboard' },
  { icon: Activity, label: 'Live Ops', path: '/agency/live-ops' },
  { icon: Package, label: 'Manage Orders', path: '/agency/orders' },
  { icon: Users, label: 'Customers', path: '/agency/customers' },
  { icon: Truck, label: 'My Drivers', path: '/agency/drivers' },
  { icon: Wallet, label: 'Wallet', path: '/agency/wallet' },
  { icon: FileText, label: 'COD Reconciliation', path: '/agency/cod-reconciliation' },
  { icon: BarChart3, label: 'Analytics', path: '/agency/analytics' },
  { icon: Bell, label: 'Notifications', path: '/agency/notifications' },
  { icon: Settings, label: 'Settings', path: '/agency/settings' },
];

export function AgencySidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/40 backdrop-blur-3xl transition-all duration-500 ease-in-out h-screen overflow-hidden flex flex-col shadow-2xl">
      {/* Header: Logo + Toggle — Unified Premium Aesthetic */}
      <SidebarHeader className={cn(
        "flex items-center justify-center border-b border-border/50 shrink-0 transition-all duration-500",
        isCollapsed ? "h-20 px-0" : "h-24 px-4"
      )}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div 
              key="full-logo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-5 group cursor-pointer"
              onClick={toggleSidebar}
            >
              <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-xl border border-white/10 shrink-0 rotate-3 transition-transform hover:rotate-0">
                <Truck className="text-white w-7 h-7" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-black text-2xl tracking-tighter text-foreground leading-none truncate uppercase font-display">Cargo<span className="text-primary">Link</span></span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mt-2 opacity-80">Agency Node</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="icon-logo"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="group cursor-pointer flex flex-col items-center"
              onClick={toggleSidebar}
            >
              <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-xl border border-white/10">
                <Truck className="text-white w-8 h-8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarHeader>

      {/* Middle: Navigation */}
      <SidebarContent className="flex-1 overflow-hidden py-8 scrollbar-hide no-scrollbar">
        <SidebarMenu className={cn("space-y-3", isCollapsed ? "px-0 items-center" : "px-4")}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path} className="w-full flex justify-center">
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={isCollapsed ? item.label : undefined}
                  className={cn(
                    "rounded-2xl transition-all duration-500 group relative flex items-center",
                    isCollapsed ? "h-14 w-14 justify-center p-0" : "h-14 w-full px-5 gap-4",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(var(--primary),0.2)]" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Link to={item.path} className="w-full h-full flex items-center relative z-10">
                    <item.icon className={cn(
                      "transition-all duration-500 shrink-0",
                      isCollapsed ? "w-7 h-7" : "w-5 h-5",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                    )} />
                    {!isCollapsed && (
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] truncate flex-1">{item.label}</span>
                    )}
                    {item.label === 'Notifications' && unreadCount > 0 && (
                      <div className={cn(
                        "bg-rose-500 text-white font-black flex items-center justify-center rounded-full animate-in zoom-in duration-300",
                        isCollapsed ? "absolute -top-1 -right-1 w-5 h-5 text-[9px]" : "w-5 h-5 text-[10px] ml-auto"
                      )}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                    {isActive && !isCollapsed && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute right-0 w-1 h-6 bg-primary-foreground rounded-full mr-2"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Bottom: Logout — Unified Premium Aesthetic */}
      <SidebarFooter className="shrink-0 border-t border-border/50 bg-white/[0.01] backdrop-blur-3xl p-4">
        <div className={cn(
          "bg-muted/30 rounded-3xl p-3 flex items-center gap-3 border border-white/5 shadow-inner transition-all duration-300 hover:bg-muted/40",
          isCollapsed ? "flex-col p-2 bg-transparent border-transparent shadow-none" : "justify-between"
        )}>
          <div className="flex items-center gap-3 min-w-0">
             <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-2xl ring-2 ring-primary/20 shadow-xl border border-white/10 flex items-center justify-center bg-hero-gradient text-white font-black text-xs transition-transform hover:scale-105">
                   {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg" />
             </div>
             
             {!isCollapsed && (
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-foreground uppercase tracking-tight truncate leading-none mb-1.5 font-display">
                     {user?.firstName} {user?.lastName}
                  </p>
                  <Badge variant="outline" className="border-none bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-none">
                      Agency
                  </Badge>
               </div>
             )}
          </div>
          
          {!isCollapsed ? (
             <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                </Button>
             </div>
          ) : (
            <div className="flex flex-col gap-4 items-center">
               <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-lg shadow-primary/10"
               >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
               <button 
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all border border-white/5"
               >
                  <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
