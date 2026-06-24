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
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';

import { NotificationBell } from '../common/NotificationBell';
import { motion } from 'framer-motion';

export function AgencyNavbar() {
  const { user } = useAuth();

  return (
    <header className="h-20 md:h-28 bg-[#020617]/50 backdrop-blur-3xl border-b border-white/5 px-4 md:px-10 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-8">
        <SidebarTrigger className="text-white/50 hover:text-white transition-colors" />
        
        {/* HUD Search Bar */}
        <div className="hidden md:flex items-center gap-4 px-6 py-4 bg-white/[0.03] rounded-[1.5rem] w-80 lg:w-[500px] border border-white/5 group transition-all focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:bg-white/[0.06] shadow-2xl">
          <Search className="w-5 h-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="System Search: Orders, Drivers, Manifests..." 
            className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-white/10 font-bold uppercase tracking-wider"
          />
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
            <Command className="w-3 h-3 text-white/30" />
            <span className="text-[9px] font-black text-white/30 uppercase">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Environment Badge */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">Sector: Casablanca Node-01</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-1.5 pr-6 rounded-[1.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] shadow-2xl transition-all flex items-center gap-4 group"
            >
              <div className="relative">
                <UserAvatar user={user} className="h-12 w-12 rounded-2xl border-2 border-white/10 shadow-2xl group-hover:border-blue-500/50 transition-all duration-500" />

                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-[#020617]" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-black text-white uppercase tracking-tight">{user?.firstName} {user?.lastName}</span>
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">{user?.role?.replace('ROLE_', '')}</span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 rounded-3xl shadow-2xl bg-[#0f172a] border-white/10 mt-4 backdrop-blur-xl">
            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.3em] text-white/20 px-4 py-3">Account Matrix</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5 mx-2" />
            <DropdownMenuItem className="rounded-2xl py-4 px-4 focus:bg-blue-600 focus:text-white cursor-pointer group transition-all">
              <User className="w-4 h-4 mr-4 text-white/20 group-hover:text-white" />
              <span className="font-black text-xs uppercase tracking-widest">Operator Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-2xl py-4 px-4 focus:bg-blue-600 focus:text-white cursor-pointer group transition-all">
              <Settings className="w-4 h-4 mr-4 text-white/20 group-hover:text-white" />
              <span className="font-black text-xs uppercase tracking-widest">Node Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 mx-2" />
            <div className="px-4 py-3">
               <div className="flex items-center justify-between text-[8px] font-black text-white/10 uppercase tracking-widest">
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
