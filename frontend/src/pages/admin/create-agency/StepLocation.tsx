import React, { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { LocationData } from './schemas';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Globe, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapPicker from '@/components/maps/MapPicker';
import { toast } from 'sonner';

interface Props {
  form: UseFormReturn<LocationData>;
}

const StepLocation: React.FC<Props> = ({ form }) => {
  const { setValue, watch, formState: { errors } } = form;
  const lat = watch('lat');
  const lng = watch('lng');
  const fullAddress = watch('fullAddress') || '';
  const [reverseLoading, setReverseLoading] = useState(false);

  const hasLocation = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0;

  const handleLocationSelect = useCallback(async (newLat: number, newLng: number) => {
    setValue('lat', newLat, { shouldValidate: true });
    setValue('lng', newLng, { shouldValidate: true });

    // Reverse geocode
    setReverseLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&accept-language=en`);
      const data = await res.json();
      if (data?.display_name) {
        setValue('fullAddress', data.display_name);
      }
      if (data?.address) {
        setValue('city', data.address.city || data.address.town || data.address.village || '');
        setValue('sector', data.address.suburb || data.address.neighbourhood || data.address.county || '');
      }
    } catch {
      // Silent fail — user can type manually
    } finally {
      setReverseLoading(false);
    }
  }, [setValue]);

  const copyCoords = () => {
    if (hasLocation) {
      navigator.clipboard.writeText(`${lat}, ${lng}`);
      toast.success('Coordinates copied');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white">Location</h3>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden border border-border/40 dark:border-white/[0.06] shadow-2xl"
      >
        <MapPicker
          onLocationSelect={handleLocationSelect}
          selectedLocation={hasLocation ? { lat, lng } : null}
          className="h-[380px] w-full rounded-3xl"
          center={[35.7595, -5.8340]}
          zoom={6}
        />
      </motion.div>

      {/* Coordinate Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="p-5 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl space-y-2 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 flex items-center gap-2">
            <Navigation className="w-3 h-3" /> Latitude
          </label>
          <p className="text-xl font-black text-foreground dark:text-white tabular-nums">
            {hasLocation ? lat.toFixed(6) : '—'}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl space-y-2 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 flex items-center gap-2">
            <Navigation className="w-3 h-3 rotate-90" /> Longitude
          </label>
          <p className="text-xl font-black text-foreground dark:text-white tabular-nums">
            {hasLocation ? lng.toFixed(6) : '—'}
          </p>
        </div>
      </motion.div>

      {hasLocation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={copyCoords}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-white/30 hover:text-foreground dark:hover:text-white hover:bg-accent/20 dark:hover:bg-white/5 rounded-xl gap-2">
            <Copy className="w-3 h-3" /> Copy Coordinates
          </Button>
        </motion.div>
      )}

      {/* Address Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 ml-1 flex items-center gap-2">
          <MapPin className="w-3 h-3" /> Resolved Address {reverseLoading && <span className="animate-pulse text-white/30">resolving...</span>}
        </label>
        <Input
          value={fullAddress}
          onChange={e => setValue('fullAddress', e.target.value)}
          placeholder="Address"
          className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-emerald-500 focus:ring-0 shadow-sm"
        />
      </motion.div>

      {errors.lat && (
        <p className="text-[10px] text-rose-400 font-bold ml-1">Select a location</p>
      )}
    </div>
  );
};

export default StepLocation;
