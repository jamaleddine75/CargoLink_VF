import React, { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  PlusCircle,
  User,
  MapPin,
  Phone,
  Package,
  Scale,
  DollarSign,
  Settings2,
  Zap,
  LocateFixed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import orderService from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';
import ShippingLabel from '@/components/orders/ShippingLabel';
import MapPicker from '@/components/maps/MapPicker';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';
import customerWalletService from '@/services/api/customerWalletService';

import { calculateTotalFees } from '@/utils/pricing';
import { getAvailableCities } from '@/services/api/publicService';

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const formSchema = z.object({
  // Sender
  senderName: z.string().min(2, "Nom de l'expéditeur requis"),
  senderPhone: z.string().min(8, "Numéro de téléphone invalide"),
  senderCity: z.string().min(2, "Ville requise"),
  senderAddress: z.string().min(5, "Adresse requise"),
  senderLat: z.number().optional(),
  senderLng: z.number().optional(),
  
  // Receiver
  receiverName: z.string().min(2, "Nom du destinataire requis"),
  receiverPhone: z.string().min(8, "Numéro de téléphone invalide"),
  receiverCity: z.string().min(2, "Ville requise"),
  receiverAddress: z.string().min(5, "Adresse de livraison requise"),
  receiverLat: z.number().optional(),
  receiverLng: z.number().optional(),

  // Parcel
  packageName: z.string().min(2, "Description du colis requise"),
  packageWeight: z.string().min(1, "Poids requis"),
  packageType: z.string().default("Parcel"),
  packagingType: z.string().default("Carton"),

  // Dimensions
  length: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),

  // Options
  fragile: z.boolean().default(false),
  liquid: z.boolean().default(false),
  dangerous: z.boolean().default(false),

  // Delivery
  deliveryOption: z.string().default("standard"),
  paymentMethod: z.string().default("CASH_ON_DELIVERY"),
  codAmount: z.string().optional(),
  notes: z.string().optional(),

  // Insurance
  insuranceEnabled: z.boolean().default(false),
  declaredValue: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<unknown>(null);
  const [mapFocus, setMapFocus] = useState<'sender' | 'receiver'>('sender');
  const [routeInfo, setRouteInfo] = useState<{distance: string, time: string} | null>(null);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderCity: "TANGER",
      receiverCity: "",
      packageType: "Parcel",
      packagingType: "Carton",
      deliveryOption: "standard",
      paymentMethod: "CASH_ON_DELIVERY",
      fragile: false,
      liquid: false,
      dangerous: false,
      insuranceEnabled: false,
    },
  });

  // Pre-fill user profile info
  React.useEffect(() => {
    getAvailableCities().then(setAvailableCities).catch(console.error);
    if (user) {
      form.reset({
        senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        senderPhone: user.phoneNumber || '',
        senderCity: user.agencyCity || "TANGER",
        senderAddress: user.agencyAddress || '',
        receiverCity: "",
        packageType: "Parcel",
        packagingType: "Carton",
        deliveryOption: "standard",
        paymentMethod: "CASH_ON_DELIVERY",
        fragile: false,
        liquid: false,
        dangerous: false,
        insuranceEnabled: false,
      });
    }
  }, [user, form]);

  // Load wallet stats
  React.useEffect(() => {
    if (isAuthenticated) {
      customerWalletService.getStats()
        .then(setWalletStats)
        .catch(err => console.error("Error loading customer wallet stats:", err));
    }
  }, [isAuthenticated]);

  const watchedValues = form.watch();

  // Route calculation for pricing
  React.useEffect(() => {
    const sLat = watchedValues.senderLat;
    const sLng = watchedValues.senderLng;
    const rLat = watchedValues.receiverLat;
    const rLng = watchedValues.receiverLng;

    if (sLat && sLng && rLat && rLng) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${rLng},${rLat}?overview=false`);
          const data = await res.json();
          if (data.routes?.[0]) {
            const distKm = (data.routes[0].distance / 1000).toFixed(1);
            const timeMins = Math.round(data.routes[0].duration / 60);
            setRouteInfo({ distance: `${distKm} km`, time: `${timeMins} min` });
          } else {
            throw new Error("No route found");
          }
        } catch (err) { 
          console.warn("OSRM routing API error, falling back to Haversine straight-line distance:", err);
          const distKm = calculateHaversineDistance(sLat, sLng, rLat, rLng);
          const timeMins = Math.round(distKm * 1.5); // Estimate 1.5 min per km
          setRouteInfo({ distance: `${distKm} km`, time: `${timeMins} min` });
        }
      };
      fetchRoute();
    } else {
      setRouteInfo(null);
    }
  }, [watchedValues.senderLat, watchedValues.senderLng, watchedValues.receiverLat, watchedValues.receiverLng]);

  const routeDistanceKm = useMemo(() => {
    return routeInfo?.distance ? parseFloat(routeInfo.distance) : 0;
  }, [routeInfo?.distance]);

  const pricing = useMemo(() => {
    // Adapt form data to calculateTotalFees format
    const formatDataForPricing = {
      parcel: { 
        weight: watchedValues.packageWeight || "0",
        dimensions: {
          length: parseFloat(watchedValues.length || "0"),
          width: parseFloat(watchedValues.width || "0"),
          height: parseFloat(watchedValues.height || "0")
        }
      },
      attributes: {
        fragile: watchedValues.fragile,
        liquid: watchedValues.liquid,
        dangerous: watchedValues.dangerous
      },
      options: { 
        deliveryOption: watchedValues.deliveryOption === 'sameday' ? 'same_day' : watchedValues.deliveryOption,
        insurance: { enabled: watchedValues.insuranceEnabled, declaredValue: watchedValues.declaredValue || "0" },
        codAmount: watchedValues.codAmount || "0"
      }
    };
    return calculateTotalFees(formatDataForPricing, routeDistanceKm);
  }, [watchedValues, routeDistanceKm]);

  const onSubmit = async (values: FormValues) => {
    if (!isAuthenticated) return toast.error('Session requise');
    
    // Check wallet balance for prepaid payment method
    if (values.paymentMethod === 'PREPAID') {
      const balance = walletStats?.balance || 0;
      if (balance < pricing.total) {
        return toast.error("Solde de portefeuille insuffisant", {
          description: `Votre solde (${balance.toFixed(2)} MAD) est insuffisant pour payer les frais de livraison (${pricing.total.toFixed(2)} MAD).`
        });
      }
    }

    setLoading(true);
    try {
      const isPrepaid = values.paymentMethod === 'PREPAID';
      const rawCodGoods = parseFloat(values.codAmount || '0') || 0;
      const payload = {
        pickupAddress: values.senderAddress,
        deliveryAddress: values.receiverAddress,
        senderCity: values.senderCity,
        receiverCity: values.receiverCity,
        pickupContactName: values.senderName,
        receiverName: values.receiverName,
        receiverPhone: values.receiverPhone,
        pickupLat: values.senderLat || null,
        pickupLng: values.senderLng || null,
        deliveryLat: values.receiverLat || null,
        deliveryLng: values.receiverLng || null,
        // If prepaid, COD is 0. If COD, COD is goods price + shipping fee
        codAmount: isPrepaid ? 0 : (rawCodGoods + pricing.total),
        urgent: values.deliveryOption === 'express' || values.deliveryOption === 'sameday',
        heavy: parseFloat(values.packageWeight || '0') > 10 || values.dangerous || values.liquid || values.fragile,
        notes: values.notes,
        items: [
          {
            itemName: values.packageName,
            quantity: 1,
            weight: parseFloat(values.packageWeight || '1') || 1,
            description: `Nature: ${values.packageType}, Emballage: ${values.packagingType}`
          }
        ]
      };

      const newOrder = await orderService.createOrder(payload);
      toast.success('Mission validée !', { description: `Suivi: ${newOrder.trackingNumber}` });
      setTicketData({ ...payload, trackingNumber: newOrder.trackingNumber });
    } catch (error: unknown) {
      // Extract validation errors from Spring Boot response
      const data = (error as any).response?.data;
      let message = 'Erreur inconnue';
      if (data?.message) {
        message = data.message;
      } else if (data?.errors && Array.isArray(data.errors)) {
        message = data.errors.join(', ');
      } else if (typeof data === 'string') {
        message = data;
      }
      toast.error('Échec de validation', { description: message });
    } finally { 
      setLoading(false); 
    }
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

  const cardShell = 'border border-border/40 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 relative overflow-hidden font-sans text-foreground">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* SENDER & RECEIVER */}
            <Card className={cardShell}>
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  Lieux d'Expédition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {/* Sender */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-6 bg-blue-600 rounded-full" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Expéditeur (Pickup)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Nom Complet *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                              <Input placeholder="Votre nom" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-blue-500/30 transition-all" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Téléphone *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                              <Input placeholder="05XX XXX XXX" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-blue-500/30 transition-all" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Ville *</FormLabel>
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('senderLat', undefined);
                              form.setValue('senderLng', undefined);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                <SelectValue placeholder="Ville d'origine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                                <SelectItem value="FNIDEQ">Fnideq</SelectItem>
                                <SelectItem value="TETOUAN">Tetouan</SelectItem>
                                <SelectItem value="MDIQ">Mdiq</SelectItem>
                                <SelectItem value="TANGER">Tanger</SelectItem>
                                <SelectItem value="Chaouen">Chaouen</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Adresse Pickup *</FormLabel>
                          <FormControl>
                            <AddressAutocomplete 
                              {...field}
                              cityContext={watchedValues.senderCity}
                              placeholder="Rue, Quartier..."
                              onSelectAddress={(addr) => {
                                form.setValue('senderLat', addr.lat);
                                form.setValue('senderLng', addr.lng);
                              }}
                              className="bg-white/5 border-white/10 h-12 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Receiver */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-6 bg-cyan-500 rounded-full" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Destinataire (Livraison)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="receiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Nom Complet *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                              <Input placeholder="Nom du destinataire" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-cyan-500/30 transition-all" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiverPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Téléphone *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                              <Input placeholder="05XX XXX XXX" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-cyan-500/30 transition-all" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiverCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Ville de destination *</FormLabel>
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('receiverLat', undefined);
                              form.setValue('receiverLng', undefined);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                <SelectValue placeholder="Choisir une ville" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                                <SelectItem value="FNIDEQ">Fnideq</SelectItem>
                                <SelectItem value="TETOUAN">Tetouan</SelectItem>
                                <SelectItem value="MDIQ">Mdiq</SelectItem>
                                <SelectItem value="TANGER">Tanger</SelectItem>
                                <SelectItem value="Chaouen">Chaouen</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiverAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">Adresse de livraison *</FormLabel>
                          <FormControl>
                            <AddressAutocomplete 
                              {...field}
                              cityContext={watchedValues.receiverCity}
                              placeholder="Rue, Quartier..."
                              onSelectAddress={(addr) => {
                                form.setValue('receiverLat', addr.lat);
                                form.setValue('receiverLng', addr.lng);
                              }}
                              className="bg-white/5 border-white/10 h-12 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Map Focus Picker */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <LocateFixed className="w-4 h-4 text-blue-500" />
                      Ajuster la position GPS
                    </h4>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setMapFocus('sender')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          mapFocus === 'sender' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Expéditeur
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapFocus('receiver')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          mapFocus === 'receiver' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Destinataire
                      </button>
                    </div>
                  </div>
                  <MapPicker 
                    center={(() => {
                      const city = mapFocus === 'sender' ? watchedValues.senderCity : watchedValues.receiverCity;
                      if (!city) return [35.7595, -5.8340] as [number, number];
                      const coords: Record<string, [number, number]> = {
                        "FNIDEQ": [35.8456, -5.3219],
                        "TETOUAN": [35.5784, -5.3684],
                        "MDIQ": [35.6858, -5.3253],
                        "TANGER": [35.7595, -5.8340],
                        "CHAOUEN": [35.1716, -5.2697],
                      };
                      return coords[city.toUpperCase()] || ([35.7595, -5.8340] as [number, number]);
                    })()}
                    selectedLocation={
                      mapFocus === 'sender' 
                        ? (watchedValues.senderLat ? { lat: watchedValues.senderLat, lng: watchedValues.senderLng! } : null)
                        : (watchedValues.receiverLat ? { lat: watchedValues.receiverLat, lng: watchedValues.receiverLng! } : null)
                    }
                    onLocationSelect={(lat, lng) => {
                      if (mapFocus === 'sender') {
                        form.setValue('senderLat', lat);
                        form.setValue('senderLng', lng);
                      } else {
                        form.setValue('receiverLat', lat);
                        form.setValue('receiverLng', lng);
                      }
                    }}
                    className="h-[250px] w-full rounded-2xl"
                  />
                </div>

              </CardContent>
            </Card>

            {/* PARCEL */}
            <Card className={cardShell}>
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center border border-amber-500/20">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  Contenu du Colis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <FormField
                  control={form.control}
                  name="packageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 font-bold">Description de l'article *</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                          <Input placeholder="Ex: Téléphone, Documents, Vêtements..." className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-amber-500/30 text-lg" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="packageWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 font-bold">Poids Estimé (KG) *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                            <Input type="number" step="0.1" placeholder="0.0" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-amber-500/30" {...field} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">KG</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 font-bold">Nature</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                              <SelectValue placeholder="Standard" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                            <SelectItem value="Parcel">Colis Standard</SelectItem>
                            <SelectItem value="Document">Documents</SelectItem>
                            <SelectItem value="Pallet">Palette</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </CardContent>
            </Card>

            {/* OPTIONS & PRICE */}
            <Card className={cardShell}>
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                    <Settings2 className="w-5 h-5 text-purple-500" />
                  </div>
                  Options de Livraison & Prix
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="deliveryOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 font-bold">Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                              <SelectValue placeholder="Standard" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                            <SelectItem value="standard">Standard (48h)</SelectItem>
                            <SelectItem value="express">Express (24h)</SelectItem>
                            <SelectItem value="sameday">Même Jour (Si possible)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 font-bold">Mode de paiement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                            <SelectItem value="CASH_ON_DELIVERY">Paiement à la livraison</SelectItem>
                            <SelectItem value="PREPAID">Portefeuille (Prépayé)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Estimate */}
                <div className="p-6 rounded-[2rem] bg-[#0f172a] border border-blue-500/20 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all duration-700" />
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estimation Frais de Livraison</p>
                      <p className="text-xs text-slate-400 mt-1">Base + Distance + Options</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tighter text-white">
                        {pricing.total.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-slate-500">MAD</span>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 font-bold">Notes (Optionnel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instructions pour le livreur..." 
                          className="min-h-[100px] bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/30 resize-none p-4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={loading || authLoading || !isAuthenticated}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-emerald-500/20 gap-3 transition-all active:scale-95"
            >
              {loading ? "Création en cours..." : "Activer la Mission"}
              {!loading && <Zap className="w-5 h-5" />}
            </Button>

          </form>
        </Form>
      </div>

    </div>
  );
};

export default CreateOrder;
