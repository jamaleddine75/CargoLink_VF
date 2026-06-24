import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Menu,
  ChevronDown,
  Mail,
  HelpCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import adminService from '@/services/api/adminService';
import { User } from '@/types';
import { NotificationBell } from '@/components/common/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/common/UserAvatar';

export function AdminNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  return (
    <header className="h-[70px] bg-background border-b border-border flex items-center justify-between px-8 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
        <h1 className="text-xl font-black text-foreground tracking-tight hidden sm:block uppercase">Control Matrix</h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative hidden lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search platform node..." 
            className="w-80 h-11 pl-12 pr-6 bg-muted border border-border rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative p-2.5 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-muted group"
          >
             {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-12 transition-transform" /> : <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          </Button>

          <NotificationBell />

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-foreground leading-none uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest">ADMIN</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex shrink-0 overflow-hidden rounded-full bg-muted h-10 w-10 ring-2 ring-border hover:ring-primary/50 transition-all">
                  <UserAvatar 
                    user={user} 
                    className="h-full w-full"
                    fallbackClassName="bg-primary/20 text-primary font-black uppercase"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border shadow-xl bg-card">
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground p-2">Administrator Console</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-foreground">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-border" />
                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
