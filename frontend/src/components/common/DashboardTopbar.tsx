import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';


interface DashboardTopbarProps {
  title?: string;
}

export function DashboardTopbar({ title = "Dashboard" }: DashboardTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-[70px] bg-background/60 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-8 shrink-0 z-20 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here if needed */}
        <h1 className="text-xl font-black text-foreground tracking-tight hidden sm:block uppercase">{title}</h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative hidden lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search platform node..."
            className="w-80 h-11 pl-12 pr-6 bg-accent/30 border border-border/40 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>

        <div className="flex items-center gap-6">
          <button className="relative p-2.5 text-muted-foreground/60 hover:text-foreground transition-all rounded-xl hover:bg-accent/30 group">
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
          </button>

          <div className="h-6 w-px bg-border/40"></div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-foreground leading-none uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1.5 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
            </div>
            <UserAvatar user={user} className="h-10 w-10 ring-2 ring-border/40 hover:ring-primary/50 transition-all" />

          </div>
        </div>
      </div>
    </header>
  );
}
