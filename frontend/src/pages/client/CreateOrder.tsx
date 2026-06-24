import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  PlusCircle,
  Zap,
  Box,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import orderService from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';
import ShippingLabel from '@/components/orders/ShippingLabel';
import { cn } from '@/lib/utils';

// Sub-components
import StepLocation from '@/components/client/order/StepLocation';
import StepParcel from '@/components/client/order/StepParcel';
import StepOptions from '@/components/client/order/StepOptions';
import StepReview from '@/components/client/order/StepReview';

// Utils & Libs
import { 
  isWithinNorthernMorocco 
} from '@/lib/logistics-constants';
import { calculateTotalFees } from '@/utils/pricing';
import { SavedAddress } from '@/services/api/addressService';

const stepLabels = ['Réseau', 'Contenu', 'Service', 'Audit'];

const CreateOrder = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, time: string} | null>(null);
  const [locating, setLocating] = useState(false);
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [formData, setFormData] = useState({
    locations: {
      sender: { name: '', phone: '', city: '', address: '', lat: null as number | null, lng: null as number | null, savedAddressId: null as string | null },
      receiver: { name: '', phone: '', city: '', address: '', lat: null as number | null, lng: null as number | null, savedAddressId: null as string | null }
    },
    parcel: {
      type: 'Parcel',
      weight: '',
      dimensions: { length: '', width: '', height: '' }
    },
    attributes: {
      fragile: false,
      liquid: false,
      dangerous: false,
      packagingType: 'Carton'
    },
    options: {
      deliveryOption: 'standard',
      insurance: { enabled: false, declaredValue: '' },
      codAmount: '',
      instructions: ''
    }
  });

  const updateNested = useCallback((path: string[], value: any) => {
    setFormData(prev => {
      const newState = { ...prev };
      let current: any = newState;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newState;
    });
  }, []);

  const routeDistanceKm = useMemo(() => {
    return routeInfo?.distance ? parseFloat(routeInfo.distance) : 0;
  }, [routeInfo?.distance]);

  const pricing = useMemo(() => {
    return calculateTotalFees(formData, routeDistanceKm);
  }, [formData, routeDistanceKm]);

  const handleLocateMe = useCallback((type: 'sender' | 'receiver') => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation indisponible');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinNorthernMorocco(latitude, longitude)) {
          toast.error('Hors zone Tanger-Tétouan');
          setLocating(false);
          return;
        }
        updateNested(['locations', type, 'lat'], latitude);
        updateNested(['locations', type, 'lng'], longitude);
        setLocating(false);
      },
      () => {
        toast.error('Position inaccessible');
        setLocating(false);
      }
    );
  }, [updateNested]);

  const handleMapClick = useCallback(async (type: 'sender' | 'receiver', lat: number, lng: number) => {
    if (!isWithinNorthernMorocco(lat, lng)) {
      toast.error('Zone non desservie');
      return;
    }
    updateNested(['locations', type, 'lat'], lat);
    updateNested(['locations', type, 'lng'], lng);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.display_name.split(', ').slice(0, 3).join(', ');
        updateNested(['locations', type, 'address'], addr);
      }
    } catch (err) { console.error(err); }
  }, [updateNested]);

  const handleAddressSelect = useCallback(async (type: 'sender' | 'receiver', addr: SavedAddress) => {
    let lat = addr.lat;
    let lng = addr.lng;
    if (!lat || !lng) {
      try {
        const query = `${addr.address}, ${addr.city}, Morocco`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch (err) { console.error(err); }
    }
    updateNested(['locations', type], {
      name: addr.contactName || formData.locations[type].name,
      phone: addr.contactPhone || formData.locations[type].phone,
      city: addr.city,
      address: addr.address,
      lat: lat || null,
      lng: lng || null,
      savedAddressId: addr.id
    });
  }, [updateNested, formData.locations]);

  useEffect(() => {
    const s = formData.locations.sender;
    const r = formData.locations.receiver;
    if (s.lat && s.lng && r.lat && r.lng) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${r.lng},${r.lat}?overview=false`);
          const data = await res.json();
          if (data.routes?.[0]) {
            const distKm = (data.routes[0].distance / 1000).toFixed(1);
            const timeMins = Math.round(data.routes[0].duration / 60);
            setRouteInfo({ distance: `${distKm} km`, time: `${timeMins} min` });
          }
        } catch (err) { console.error(err); }
      };
      fetchRoute();
    } else { setRouteInfo(null); }
  }, [formData.locations.sender.lat, formData.locations.sender.lng, formData.locations.receiver.lat, formData.locations.receiver.lng]);

  const isStep1Valid = () => {
    const { sender, receiver } = formData.locations;
    return !!(sender.name && sender.phone && sender.city && sender.address && sender.lat &&
           receiver.name && receiver.phone && receiver.city && receiver.address && receiver.lat);
  };

  const isStep2Valid = () => !!(formData.parcel.weight && formData.parcel.type);
  const isStep3Valid = () => !!(formData.options.codAmount && parseFloat(formData.options.codAmount) > 0);

  const handleNextStep = () => {
    if (step === 1 && !isStep1Valid()) return toast.error('Détails de localisation requis');
    if (step === 2 && !isStep2Valid()) return toast.error('Détails du colis requis');
    if (step === 3 && !isStep3Valid()) return toast.error('Montant COD requis');
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Session requise');
    setLoading(true);
    try {
      const payload = {
        pickupAddress: formData.locations.sender.address,
        deliveryAddress: formData.locations.receiver.address,
        senderCity: formData.locations.sender.city,
        receiverCity: formData.locations.receiver.city,
        pickupContactName: formData.locations.sender.name,
        pickupContactPhone: formData.locations.sender.phone,
        receiverName: formData.locations.receiver.name,
        receiverPhone: formData.locations.receiver.phone,
        pickupLat: formData.locations.sender.lat,
        pickupLng: formData.locations.sender.lng,
        deliveryLat: formData.locations.receiver.lat,
        deliveryLng: formData.locations.receiver.lng,
        codAmount: (parseFloat(formData.options.codAmount) || 0) + pricing.total,
        parcelType: formData.parcel.type,
        weight: parseFloat(formData.parcel.weight),
        length: parseFloat(formData.parcel.dimensions.length) || 0,
        width: parseFloat(formData.parcel.dimensions.width) || 0,
        height: parseFloat(formData.parcel.dimensions.height) || 0,
        fragile: formData.attributes.fragile,
        liquid: formData.attributes.liquid,
        dangerous: formData.attributes.dangerous,
        packagingType: formData.attributes.packagingType,
        deliveryOption: formData.options.deliveryOption,
        insurance: formData.options.insurance.enabled,
        declaredValue: parseFloat(formData.options.insurance.declaredValue) || 0,
        notes: formData.options.instructions
      };
      const newOrder = await orderService.createOrder(payload);
      toast.success('Mission validée !');
      setTicketData({ ...payload, trackingNumber: newOrder.trackingNumber });
    } catch (error: any) {
      toast.error('Échec de validation', { description: error.response?.data?.message });
    } finally { setLoading(false); }
  };

  if (ticketData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl relative z-10 text-center">
          <div className="mb-10">
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Mission <span className="text-emerald-500">Activée</span></h2>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.4em] mt-4 opacity-40">Étiquette logistique générée</p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 scale-90 sm:scale-100 p-2">
              <ShippingLabel order={ticketData} isPrintMode={false} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Button onClick={() => window.print()} className="h-16 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-3 hover:scale-105 transition-all">
                <Printer className="w-5 h-5" /> Imprimer le Ticket
             </Button>
             <Button onClick={() => window.location.reload()} variant="outline" className="h-16 border-white/10 bg-white/5 font-black uppercase text-[10px] tracking-widest rounded-2xl gap-3 hover:bg-white/10 transition-all">
                <PlusCircle className="w-5 h-5" /> Nouvelle Mission
             </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-[1400px] mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="flex items-center gap-5">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shrink-0">
                 <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/70">Terminal Saisie</p>
                 </div>
                 <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-foreground leading-none">Nouvel <span className="text-primary">Envoi</span></h1>
              </div>
           </div>

           <div className="flex-1 max-w-2xl w-full">
              <div className="flex items-center gap-2 mb-4">
                 {stepLabels.map((label, idx) => (
                    <div key={label} className={cn(
                       "flex-1 h-2 rounded-full transition-all duration-700",
                       step >= idx + 1 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-white/5"
                    )} />
                 ))}
              </div>
              <div className="flex justify-between">
                 {stepLabels.map((label, idx) => (
                    <p key={label} className={cn(
                       "text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                       step >= idx + 1 ? "text-primary" : "text-white/20"
                    )}>{label}</p>
                 ))}
              </div>
           </div>
        </header>

        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-6 md:p-12 shadow-2xl"
            >
              {step === 1 && <StepLocation formData={formData} updateNested={updateNested} handleAddressSelect={handleAddressSelect} handleMapClick={handleMapClick} handleLocateMe={handleLocateMe} locating={locating} />}
              {step === 2 && <StepParcel formData={formData} updateNested={updateNested} />}
              {step === 3 && <StepOptions formData={formData} updateNested={updateNested} />}
              {step === 4 && <StepReview formData={formData} routeInfo={routeInfo} pricing={pricing} loading={loading} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 mt-8">
            <Button type="button" variant="ghost" className="h-16 px-10 rounded-[2rem] bg-white/5 border border-white/10 font-black uppercase text-[10px] tracking-widest disabled:opacity-20" onClick={() => setStep(step - 1)} disabled={step === 1}>
              <ChevronLeft className="w-5 h-5 mr-3" /> Précédent
            </Button>
            <Button type={step < 4 ? "button" : "submit"} className={cn(
               "flex-1 h-16 rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-white shadow-2xl transition-all active:scale-95",
               step < 4 ? "bg-primary shadow-primary/20" : "bg-emerald-600 shadow-emerald-500/20"
            )} onClick={step < 4 ? handleNextStep : undefined} disabled={loading || authLoading || !isAuthenticated}>
              {loading ? "Calcul du réseau..." : step < 4 ? "Étape Suivante" : "Activer la Mission"}
              {step < 4 ? <ChevronRight className="w-5 h-5 ml-3" /> : <Zap className="w-5 h-5 ml-3" />}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Decorative Elements */}
      <div className="fixed top-1/2 -left-10 opacity-5 pointer-events-none -rotate-90">
         <p className="text-8xl font-black uppercase tracking-[0.5em] whitespace-nowrap">CARGOLINK CORE</p>
      </div>
    </div>
  );
};

export default CreateOrder;
