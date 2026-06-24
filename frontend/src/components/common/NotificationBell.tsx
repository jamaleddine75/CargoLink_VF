import React, { useState, useEffect } from 'react';
import { Bell, Loader2, Package, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import notificationService, { Notification } from '@/services/api/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';



export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();


  const getIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT': return <Package className="w-4 h-4 text-blue-500" />;
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'ISSUE': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 mt-2 overflow-hidden">
        <DropdownMenuLabel className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="font-black text-xs uppercase tracking-widest text-slate-500">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-none font-bold text-[10px]">
              {unreadCount} Nouvelles
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif.id} 
                className={cn(
                  "p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer flex gap-4 items-start transition-colors",
                  !notif.isRead ? "bg-blue-500/[0.03] dark:bg-blue-500/[0.02]" : "opacity-60"
                )}
                onClick={() => markAsRead(notif.id)}

              >
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex flex-col gap-1 flex-1">
                  <p className={cn("text-xs leading-relaxed", !notif.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500")}>
                    {notif.message}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-slate-100 dark:bg-slate-800" />
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 h-10"
            onClick={() => navigate('/notifications')}
          >
            Voir tout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
