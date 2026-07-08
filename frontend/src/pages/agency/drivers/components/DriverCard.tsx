import React, { useState } from 'react';
import {
  Phone, Truck, MoreVertical, ShieldCheck, ShieldAlert,
  Clock, Loader2
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
} from "@/components/ui/dropdown-menu";

interface DriverCardProps {
  driver: Driver;
  idx: number;
  onUpdate: () => void;
  onViewHistory: (driver: Driver) => void;
}

export const DriverCard = React.forwardRef(
  function DriverCard({ driver, idx, onUpdate, onViewHistory }: DriverCardProps, ref: React.Ref<HTMLDivElement> | null) {
  const [extending, setExtending] = useState(false);
  const permitStatus = getPermitStatus(driver.workPermissionUntil);
  const isOnline = driver.status === 'ONLINE';

  const handleExtendPermission = async () => {
    if (extending) return;
    try {
      setExtending(true);
      const updated = await agencyService.extendWorkPermission(driver.id);
      const newExpiry = updated?.workPermissionUntil
        ? ` — valid until ${formatTimestamp(updated.workPermissionUntil)}`
        : '';
      toast.success(`Permis de ${driver.firstName} prolongé (+30 jours)${newExpiry}`);
      onUpdate();
    } catch (err: unknown) {
      const msg = err?.response?.data?.message || err?.message || 'Échec de la prolongation.';
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
    >
      <Card className="bg-card border border-border hover:border-primary/30 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 rounded-lg border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.lastName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm rounded-lg">
                    {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {driver.firstName} {driver.lastName}
                </h3>
                <Badge variant="outline" className={`mt-0.5 text-[10px] font-medium px-1.5 py-0 ${isOnline ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border rounded-lg p-1 min-w-[180px]">
                <DropdownMenuItem
                  onClick={() => onViewHistory(driver)}
                  className="rounded-md text-xs font-medium cursor-pointer px-3 py-2"
                >
                  <Clock className="w-3.5 h-3.5 mr-2" /> Historique
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info Grid */}
          <div className="space-y-3 mb-4">
            {/* Work Permit Status */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${permitStatus.isExpired ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'}`}>
              <div className="flex items-center gap-2">
                {permitStatus.isExpired ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">{permitStatus.label}</p>
                  <p className="text-[9px] opacity-70">
                    {driver.workPermissionUntil ? formatTimestamp(driver.workPermissionUntil) : 'Aucune date'}
                  </p>
                </div>
              </div>
              {permitStatus.isExpired && (
                <Button
                  size="sm"
                  disabled={extending}
                  onClick={handleExtendPermission}
                  className="h-7 rounded-md text-[10px] font-semibold px-3"
                >
                  {extending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Prolonger'}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-[9px] font-medium uppercase text-muted-foreground tracking-wide mb-1">Véhicule</p>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{driver.vehiclePlate || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-[9px] font-medium uppercase text-muted-foreground tracking-wide mb-1">Contact</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{driver.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            onClick={() => onViewHistory(driver)}
            className="w-full h-9 rounded-md text-xs font-medium border-border"
          >
            <Clock className="w-3.5 h-3.5 mr-2" /> Historique
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
  }
);

DriverCard.displayName = 'DriverCard';
export default DriverCard;
