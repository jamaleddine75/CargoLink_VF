import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, ShieldCheck,
  Package, Users, Globe, Wallet,
  CreditCard, Activity, Bell, Settings,
  LogOut, ChevronLeft, ChevronRight,
  Shield, ShieldAlert, Truck, Map, BarChart3,
  HeadphonesIcon, DollarSign, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from "@/components/ThemeProvider";
import adminService from '@/services/api/adminService';

interface NavItem {
  title: string;
  icon: any;
  path: string;
  badge?: string | number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const [pendingUsersCount, setPendingUsersCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    adminService.getPendingUsers().then((users) => {
      if (users?.length > 0) setPendingUsersCount(users.length);
    }).catch(() => {});
  }, []);

  const navigation: NavGroup[] = [
    {
      label: 'Platform',
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { title: 'Agencies', icon: Building2, path: '/admin/agencies' },
        { title: 'Admins', icon: ShieldCheck, path: '/admin/admins' },
      ]
    },
    {
      label: 'Operations',
      items: [
        { title: 'Orders', icon: Package, path: '/admin/orders' },
        { title: 'Users', icon: Users, path: '/admin/users', badge: pendingUsersCount },
        { title: 'Drivers', icon: Truck, path: '/admin/drivers' },
        { title: 'Regions', icon: MapPin, path: '/admin/regions' },
        { title: 'Route Monitor', icon: Shield, path: '/admin/monitor' },
        { title: 'Live Map', icon: Globe, path: '/admin/map' },
      ]
    },
    {
      label: 'Finance',
      items: [
        { title: 'Finance', icon: DollarSign, path: '/admin/finance' },
        { title: 'Wallets', icon: Wallet, path: '/admin/wallets' },
        { title: 'Pricing', icon: CreditCard, path: '/admin/pricing' },
      ]
    },
    {
      label: 'Intelligence',
      items: [
        { title: 'Audit Logs', icon: ShieldAlert, path: '/admin/logs' },
        { title: 'Remittances', icon: ShieldAlert, path: '/admin/audit-remittances' },
      ]
    },
    {
      label: 'System',
      items: [
        { title: 'Notifications', icon: Bell, path: '/admin/notifications' },
        { title: 'Settings', icon: Settings, path: '/admin/settings' },
      ]
    }
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen bg-card dark:bg-card/40 backdrop-blur-3xl border-r border-border dark:border-border/50 z-50 hidden lg:flex flex-col transition-all duration-300 shadow-2xl overflow-hidden"
      >
        {/* Logo Section — Unified Premium Aesthetic */}
        <div className="p-4 h-24 flex items-center justify-between border-b border-border/50 relative">
           <AnimatePresence mode="wait">
             {!isCollapsed ? (
               <motion.div
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="flex items-center gap-3"
               >
                  <div className="w-12 h-12 rounded-[1rem] bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform duration-500 hover:rotate-0">
                     <Shield className="text-white w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                     <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none font-display">
                        Cargo<span className="text-primary">Link</span>
                     </h2>
                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.35em] mt-1.5 opacity-80">Control Matrix</p>
                  </div>
               </motion.div>
             ) : (
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="w-14 h-14 mx-auto rounded-2xl bg-hero-gradient flex items-center justify-center shadow-xl shadow-primary/20"
               >
                  <Shield className="text-white w-7 h-7" />
               </motion.div>
             )}
           </AnimatePresence>

           {!isCollapsed && (
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setIsCollapsed(true)}
               className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
             >
                <ChevronLeft className="w-5 h-5" />
             </Button>
           )}
        </div>

        {/* Navigation Content — Refined Spacing & Typography */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 no-scrollbar scrollbar-hide">
           {navigation.map((group) => (
             <div key={group.label} className="space-y-4">
                {!isCollapsed && (
                  <div className="px-4 flex items-center gap-3">
                    <p className="text-[10px] font-black text-foreground/50 dark:text-muted-foreground/40 uppercase tracking-[0.35em]">
                       {group.label}
                    </p>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                )}
                
                <div className="space-y-1.5">
                   {group.items.map((item) => (
                     <NavItemComponent 
                        key={item.path} 
                        item={item} 
                        isCollapsed={isCollapsed} 
                        isActive={location.pathname === item.path}
                     />
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* User Profile — Premium Unified Aesthetic */}
        <div className="p-4 border-t border-border/50 bg-accent/5 backdrop-blur-3xl">
           <div className={cn(
             "bg-muted/50 dark:bg-muted/30 rounded-3xl p-3 flex items-center gap-3 border border-border/50 dark:border-white/5 shadow-sm transition-all duration-300 hover:bg-muted/80 dark:hover:bg-muted/40",
             isCollapsed ? "flex-col p-2 bg-transparent border-transparent shadow-none" : "justify-between"
           )}>
              <div className="flex items-center gap-3 min-w-0">
                 <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-xl border border-white/10 transition-transform hover:scale-105">
                        <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} />
                        <AvatarFallback className="bg-hero-gradient text-white font-black text-xs">
                           {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg" />
                 </div>
                 
                 {!isCollapsed && (
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground uppercase tracking-tight truncate leading-none mb-1.5 font-display">
                         {user?.firstName} {user?.lastName}
                      </p>
                      <Badge variant="outline" className="border-none bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-none">
                          Admin
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
                        onClick={logout}
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
                      onClick={() => setIsCollapsed(false)}
                      className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all border border-white/5"
                   >
                      <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              )}
           </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -right-20 top-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -left-20 bottom-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      </motion.aside>

      {/* Main Content Spacer */}
      <div 
        className="transition-all duration-300 hidden lg:block"
        style={{ width: isCollapsed ? 72 : 240 }}
      />
    </TooltipProvider>
  );
};

  const NavItemComponent = ({ item, isCollapsed, isActive }: { item: NavItem, isCollapsed: boolean, isActive: boolean }) => {
  const content = (
    <NavLink 
      to={item.path}
      className={cn(
        "relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden",
        isCollapsed ? "justify-center px-0 w-12 mx-auto" : "px-4 gap-4",
        isActive 
          ? "bg-primary text-white shadow-xl shadow-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 dark:hover:bg-muted"
      )}
    >
       <item.icon className={cn(
         "w-5 h-5 transition-all duration-500",
         isActive ? "text-white" : "text-muted-foreground/60 dark:text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:rotate-6"
       )} />
       
       {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
             <span className="text-[11px] font-black uppercase tracking-widest truncate">{item.title}</span>
             {item.badge && (
                <Badge className={cn(
                  "border-none font-black text-[9px] rounded-lg px-2 h-5 transition-all duration-500",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}>
                   {item.badge}
                </Badge>
             )}
          </div>
       )}

       {/* Premium Shimmer Effect on Active */}
       {isActive && (
         <motion.div
           layoutId="navShimmer"
           className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent -translate-x-full animate-shimmer"
         />
       )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
         <TooltipTrigger asChild>{content}</TooltipTrigger>
         <TooltipContent side="right" className="bg-card border border-border text-foreground font-black text-[10px] uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-2xl backdrop-blur-xl">
            {item.title}
         </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default AdminSidebar;
