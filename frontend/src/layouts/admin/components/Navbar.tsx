import React from 'react';
import { Search, User, Settings } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import { useNavigate } from 'react-router-dom';

export function AdminNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

        {/* Unified Simple Search Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg w-80 lg:w-[400px] border border-border group transition-all focus-within:bg-muted/60">
          <Search className="w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search orders, agencies, users..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground/60 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Environment Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Casablanca Node-01</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 pr-3 rounded-lg border border-border hover:bg-muted/50 transition-all group">
              <UserAvatar user={user} className="h-8 w-8 rounded-md border border-border" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-foreground">{user?.firstName} {user?.lastName}</span>
                <span className="text-[9px] text-primary font-medium uppercase tracking-wider">{user?.role?.replace('ROLE_', '')}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-lg border border-border bg-card shadow-md mt-2">
            <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground px-3 py-2">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-md py-2 px-3 focus:bg-primary focus:text-primary-foreground cursor-pointer flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-xs">My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-md py-2 px-3 focus:bg-primary focus:text-primary-foreground cursor-pointer flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-xs">Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
