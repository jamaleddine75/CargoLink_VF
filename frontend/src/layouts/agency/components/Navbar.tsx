import React from 'react';
import { Search, Bell, User, Menu, Settings, Globe, Command } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import { NotificationBell } from '@/components/common/NotificationBell';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AgencyNavbar() {
  const { user } = useAuth();

  return (
    <header className="h-20 md:h-28 bg-background/50 backdrop-blur-3xl border-b border-border/60 px-4 md:px-10 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-8">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

        {/* HUD Search Bar */}
        <div className="hidden md:flex items-center gap-4 px-6 py-4 bg-accent/40 rounded-[1.5rem] w-80 lg:w-[500px] border border-border/60 group transition-all focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-accent/60 shadow-2xl">
          <Search className="w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="System Search: Orders, Drivers, Manifests..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground/40 font-bold uppercase tracking-wider"
          />
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/40 border border-border/60">
            <Command className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[9px] font-black text-muted-foreground/40 uppercase">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Environment Badge */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest">Sector: Casablanca Node-01</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-1.5 pr-6 rounded-[1.5rem] border border-border/60 bg-accent/40 hover:bg-accent/60 shadow-2xl transition-all flex items-center gap-4 group"
            >
              <div className="relative">
                <UserAvatar user={user} className="h-12 w-12 rounded-2xl border-2 border-border/60 shadow-2xl group-hover:border-primary/50 transition-all duration-500" />

                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-black text-foreground uppercase tracking-tight">{user?.firstName} {user?.lastName}</span>
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{user?.role?.replace('ROLE_', '')}</span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 rounded-3xl shadow-2xl mt-4 backdrop-blur-xl">
            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 px-4 py-3">Account Matrix</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40 mx-2" />
            <DropdownMenuItem className="rounded-2xl py-4 px-4 focus:bg-primary focus:text-white cursor-pointer group transition-all">
              <User className="w-4 h-4 mr-4 text-muted-foreground/40 group-hover:text-foreground" />
              <span className="font-black text-xs uppercase tracking-widest">Operator Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-2xl py-4 px-4 focus:bg-primary focus:text-white cursor-pointer group transition-all">
              <Settings className="w-4 h-4 mr-4 text-muted-foreground/40 group-hover:text-foreground" />
              <span className="font-black text-xs uppercase tracking-widest">Node Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40 mx-2" />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">
                <span>Last Login</span>
                <span>14:32:01</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
