import React, { useState } from 'react';
import {
  Phone, Truck, MoreVertical, ShieldCheck, ShieldAlert,
  Clock, Loader2, Sparkles, Ban, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from 'framer-motion';
import { Driver } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { getPermitStatus } from '../utils/permitUtils';
import agencyService from '@/services/api/agencyService';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

interface DriverHUDCardProps {
  driver: Driver;
  idx: number;
  onUpdate: () => void;
  onAction: (driver: Driver, action: 'SUSPEND' | 'REACTIVATE' | 'BLACKLIST') => void;
  onViewHistory: (driver: Driver) => void;
}

const disciplinaryStyling = {
  ACTIVE: { cardBorder: 'hover:border-blue-500/30', glow: 'bg-blue-500' },
  SUSPENDED: { cardBorder: 'border-amber-500/20 hover:border-amber-500/40', glow: 'bg-amber-500' },
  BLACKLISTED_LOCAL: { cardBorder: 'border-rose-500/20 hover:border-rose-500/40', glow: 'bg-rose-500' },
};

export const DriverHUDCard = React.forwardRef(
  function DriverHUDCard({ driver, idx, onUpdate, onAction, onViewHistory }: DriverHUDCardProps, ref: React.Ref<HTMLDivElement> | null) {
  const [extending, setExtending] = useState(false);
  const permitStatus = getPermitStatus(driver.workPermissionUntil);
  const isOnline = driver.status === 'ONLINE';
  const disciplinaryStatus = driver.disciplinaryStatus || 'ACTIVE';
  const styling = disciplinaryStyling[disciplinaryStatus];

  const handleExtendPermission = async () => {
    if (extending) return;
    try {
      setExtending(true);
      const updated = await agencyService.extendWorkPermission(driver.id);
      const newExpiry = updated?.workPermissionUntil
        ? ` — valid until ${formatTimestamp(updated.workPermissionUntil)}`
        : '';
      toast.success(`${driver.firstName}'s permit extended (+30 days)${newExpiry}`, {
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        className: "bg-zinc-900 border-emerald-500/20 text-foreground"
      });
      onUpdate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to extend permission.';
      toast.error(msg);
    } finally {
      setExtending(false);
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.03 }}
      className="group"
    >
      <Card className={`bg-accent/10 backdrop-blur-3xl border border-border/40 ${styling.cardBorder} rounded-[2.5rem] overflow-hidden transition-all duration-500 relative group shadow-2xl`}>
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-2xl border-2 border-border/40 shadow-2xl group-hover:scale-105 transition-transform">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.lastName}`} />
                  <AvatarFallback className="bg-blue-600 text-primary-foreground font-black uppercase text-xl">
                    {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#020617] ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              </div>
              <div>
                <h3 className="font-black text-primary-foreground uppercase tracking-tighter text-xl leading-none mb-2">
                  {driver.firstName} {driver.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`rounded-lg px-2 py-0 border-none text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent/30 text-muted-foreground/40'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  {disciplinaryStatus === 'SUSPENDED' && (
                    <Badge className="rounded-lg px-2 py-0 border-none text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400">
                      Suspended
                    </Badge>
                  )}
                  {disciplinaryStatus === 'BLACKLISTED_LOCAL' && (
                    <Badge className="rounded-lg px-2 py-0 border-none text-[8px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400">
                      Blacklisted
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center hover:bg-accent/40 transition-colors">
                  <MoreVertical className="w-5 h-5 text-muted-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border/40 rounded-2xl p-2 min-w-[200px]">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-3 py-2">
                  Unit Control
                </DropdownMenuLabel>

                {disciplinaryStatus === 'ACTIVE' && (
                  <DropdownMenuItem
                    onClick={() => onAction(driver, 'SUSPEND')}
                    className="rounded-xl focus:bg-amber-500/10 focus:text-amber-400 text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                  >
                    <ShieldAlert className="w-4 h-4 mr-3" /> Suspend Unit
                  </DropdownMenuItem>
                )}

                {disciplinaryStatus === 'SUSPENDED' && (
                  <DropdownMenuItem
                    onClick={() => onAction(driver, 'REACTIVATE')}
                    className="rounded-xl focus:bg-emerald-500/10 focus:text-emerald-400 text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-3" /> Reactivate Unit
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => onViewHistory(driver)}
                  className="rounded-xl focus:bg-blue-500/10 focus:text-blue-400 text-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                >
                  <Clock className="w-4 h-4 mr-3" /> View History
                </DropdownMenuItem>

                {disciplinaryStatus !== 'BLACKLISTED_LOCAL' && (
                  <>
                    <DropdownMenuSeparator className="bg-border/40 my-2" />
                    <DropdownMenuItem
                      onClick={() => onAction(driver, 'BLACKLIST')}
                      className="rounded-xl focus:bg-rose-500/10 focus:text-rose-400 text-destructive/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                    >
                      <Ban className="w-4 h-4 mr-3" /> Blacklist Node
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info Grid */}
          <div className="space-y-4 mb-6">
            {/* Work Permit Status */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${permitStatus.isExpired ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
              <div className="flex items-center gap-3">
                {permitStatus.isExpired ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{permitStatus.label}</p>
                  <p className="text-[8px] opacity-60 uppercase font-bold">
                    {driver.workPermissionUntil ? formatTimestamp(driver.workPermissionUntil) : 'No date'}
                  </p>
                </div>
              </div>
              {permitStatus.isExpired && (
                <Button
                  size="sm"
                  disabled={extending}
                  onClick={handleExtendPermission}
                  className="h-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 transition-all shrink-0"
                >
                  {extending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Extend'}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/30 p-4 rounded-2xl border border-border/40">
                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Vehicle</p>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">{driver.vehiclePlate || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-accent/30 p-4 rounded-2xl border border-border/40">
                <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Contact</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">{driver.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onViewHistory(driver)}
              className="flex-1 rounded-2xl h-12 bg-accent/30 hover:bg-accent/40 border border-border/40 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Clock className="w-3 h-3 mr-2" /> History
            </Button>

            {disciplinaryStatus === 'ACTIVE' && (
              <Button
                onClick={() => onAction(driver, 'SUSPEND')}
                className="flex-1 rounded-2xl h-12 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <ShieldAlert className="w-3 h-3 mr-2" /> Suspend
              </Button>
            )}

            {disciplinaryStatus === 'SUSPENDED' && (
              <Button
                onClick={() => onAction(driver, 'REACTIVATE')}
                className="flex-1 rounded-2xl h-12 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <RefreshCw className="w-3 h-3 mr-2" /> Reactivate
              </Button>
            )}

            {disciplinaryStatus === 'BLACKLISTED_LOCAL' && (
              <Button
                disabled
                className="flex-1 rounded-2xl h-12 bg-rose-500/5 border border-rose-500/20 text-rose-500/40 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
              >
                <Ban className="w-3 h-3 mr-2" /> Blacklisted
              </Button>
            )}
          </div>
        </CardContent>

        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${styling.glow}`} />
      </Card>
    </motion.div>
  );
  }
);

DriverHUDCard.displayName = 'DriverHUDCard';
