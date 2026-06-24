import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle,
  Bell, 
  Settings,
  LogOut,
  CreditCard,
  User,
  MapPin,
  Book,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
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
} from "@/components/ui/sidebar";
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import UserAvatar from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';
import { useTheme } from "@/components/ThemeProvider";
import { useSidebar } from "@/components/ui/sidebar";



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
    title: "Address Book",
    url: "/client/address-book",
    icon: Book,
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
  {
    title: "Support Center",
    url: "/client/support",
    icon: MessageSquare,
  },
];

export function ClientSidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <User className="text-primary-foreground w-6 h-6" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-black text-xl tracking-tighter text-foreground">CargoLink</h2>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Customer Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 scrollbar-hide no-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-2 group-data-[collapsible=icon]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isNotifications = item.title === "Notifications";
                const displayBadge = isNotifications ? unreadCount : 0;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="h-12 rounded-xl transition-all duration-300 hover:bg-primary/10 hover:text-primary active:scale-95 group">
                      <NavLink to={item.url} className={({ isActive }) => 
                        `flex items-center gap-3 w-full px-4 h-full ${isActive ? 'bg-primary/10 text-primary font-bold' : ''}`
                      }>
                        <item.icon className="w-5 h-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {displayBadge > 0 && (
                          <span className="ml-auto w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center group-data-[collapsible=icon]:hidden animate-in zoom-in duration-300">
                            {displayBadge > 9 ? '9+' : displayBadge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarSeparator className="my-4 opacity-5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-2 group-data-[collapsible=icon]:hidden">
            Account
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" className="h-12 rounded-xl hover:bg-primary/10 hover:text-primary active:scale-95 transition-all duration-300">
                <NavLink to="/client/settings" className={({ isActive }) => 
                  `flex items-center gap-3 w-full px-4 h-full ${isActive ? 'bg-primary/10 text-primary font-bold' : ''}`
                }>
                  <Settings className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </NavLink>
               </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate leading-none">
                     Customer
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
