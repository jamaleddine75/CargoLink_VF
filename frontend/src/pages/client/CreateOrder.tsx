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
import CitySelector from '@/components/common/CitySelector';
import { useReverseGeocoding } from '@/hooks/useReverseGeocoding';
import customerWalletService from '@/services/api/customerWalletService';
import { printShippingLabel } from '@/utils/printUtils';

import { calculateTotalFees } from '@/utils/pricing';
import { getAvailableCities } from '@/services/api/publicService';
import PageHeader from '@/components/shared/PageHeader';

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
  const [routeInfo, setRouteInfo] = useState<{ distance: string, time: string } | null>(null);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: "",
      senderPhone: "",
      senderCity: "TANGER",
      senderAddress: "",
      senderLat: undefined,
      senderLng: undefined,
      receiverName: "",
      receiverPhone: "",
      receiverCity: "",
      receiverAddress: "",
      receiverLat: undefined,
      receiverLng: undefined,
      packageName: "",
      packageWeight: "",
      packageType: "Parcel",
      packagingType: "Carton",
      length: "",
      width: "",
      height: "",
      fragile: false,
      liquid: false,
      dangerous: false,
      deliveryOption: "standard",
      paymentMethod: "CASH_ON_DELIVERY",
      codAmount: "",
      notes: "",
      insuranceEnabled: false,
      declaredValue: "",
    },
  });

  const watchedValues = form.watch();

  const senderGeocode = useReverseGeocoding({
    currentAddress: watchedValues.senderAddress || '',
    updateAddress: (val) => form.setValue('senderAddress', val),
    updateCity: (val) => form.setValue('senderCity', val),
    updatePostalCode: () => { },
    updateCoordinates: (lat, lng) => {
      form.setValue('senderLat', lat);
      form.setValue('senderLng', lng);
    },
    allowedCities: availableCities
  });

  const receiverGeocode = useReverseGeocoding({
    currentAddress: watchedValues.receiverAddress || '',
    updateAddress: (val) => form.setValue('receiverAddress', val),
    updateCity: (val) => form.setValue('receiverCity', val),
    updatePostalCode: () => { },
    updateCoordinates: (lat, lng) => {
      form.setValue('receiverLat', lat);
      form.setValue('receiverLng', lng);
    },
    allowedCities: availableCities
  });

  // Pre-fill user profile info
  const hasPrefilled = React.useRef(false);
  React.useEffect(() => {
    getAvailableCities().then(setAvailableCities).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (user && !hasPrefilled.current) {
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
      hasPrefilled.current = true;
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

  const [estimatedTotal, setEstimatedTotal] = useState<number>(15.0);

  React.useEffect(() => {
    const fetchPricingEstimate = async () => {
      if (routeDistanceKm <= 0) {
        setEstimatedTotal(15.0);
        return;
      }
      try {
        const payload = {
          distanceKm: routeDistanceKm,
          codAmount: parseFloat(watchedValues.codAmount || "0"),
          urgent: watchedValues.deliveryOption === 'express' || watchedValues.deliveryOption === 'sameday',
          heavy: parseFloat(watchedValues.packageWeight || '0') > 10 || watchedValues.dangerous || watchedValues.liquid || watchedValues.fragile
        };
        const res = await orderService.estimateFee(payload) as any;
        if (res && typeof res.totalFee === 'number') {
          setEstimatedTotal(res.totalFee);
        } else if (res && typeof res.total === 'number') {
          setEstimatedTotal(res.total);
        }
      } catch (err) {
        console.error("Failed to fetch backend pricing estimate, falling back to local calculation:", err);
        const formatDataForPricing = {
          parcel: {
            weight: watchedValues.packageWeight || "0",
            type: watchedValues.packageType,
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
        const localPricing = calculateTotalFees(formatDataForPricing, routeDistanceKm);
        setEstimatedTotal(localPricing.total);
      }
    };
    fetchPricingEstimate();
  }, [
    routeDistanceKm,
    watchedValues.codAmount,
    watchedValues.deliveryOption,
    watchedValues.packageWeight,
    watchedValues.dangerous,
    watchedValues.liquid,
    watchedValues.fragile,
    watchedValues.packageType,
    watchedValues.length,
    watchedValues.width,
    watchedValues.height,
    watchedValues.insuranceEnabled,
    watchedValues.declaredValue
  ]);

  const pricing = useMemo(() => {
    return { total: estimatedTotal };
  }, [estimatedTotal]);

  const onSubmit = async (values: FormValues) => {
    if (!isAuthenticated) return toast.error('Session requise');

    if (routeDistanceKm > 40) {
      return toast.error('Distance de livraison trop longue', {
        description: 'La distance maximale de livraison est de 40 km.'
      });
    }

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
        senderPhone: values.senderPhone,
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
      <div className="flex flex-col items-center justify-center p-6 space-y-6">
        <Card className="w-full max-w-2xl border border-border bg-card p-8 text-center rounded-lg shadow-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Mission Activée</h2>
            <p className="text-xs text-muted-foreground mt-1">L'expédition a été enregistrée. L'étiquette de transport est prête.</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="border border-border bg-muted/30 p-2 rounded-lg">
              <ShippingLabel order={ticketData} isPrintMode={false} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => printShippingLabel(ticketData)} className="w-full gap-2">
              <Printer className="w-4 h-4" /> Imprimer le Ticket
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full gap-2">
              <PlusCircle className="w-4 h-4" /> Nouvelle Mission
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Nouvel Envoi"
        description="Créez une nouvelle mission d'expédition locale."
        action={
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Section 1: Map */}
          <Card className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-primary" />
                Localisation sur la carte
              </CardTitle>
              <div className="flex gap-1 bg-muted p-1 rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setMapFocus('sender')}
                  className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all ${mapFocus === 'sender' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Expéditeur
                </button>
                <button
                  type="button"
                  onClick={() => setMapFocus('receiver')}
                  className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all ${mapFocus === 'receiver' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Destinataire
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                    senderGeocode.triggerGeocoding(lat, lng);
                  } else {
                    receiverGeocode.triggerGeocoding(lat, lng);
                  }
                }}
                className="h-[300px] w-full"
              />
            </CardContent>
          </Card>

          {/* Section 2: Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SENDER CARD */}
            <Card className="border border-border bg-card rounded-lg shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Informations Expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Nom Complet *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Nom de l'expéditeur" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Téléphone *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="06XX XXX XXX" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Ville de départ *</FormLabel>
                        <FormControl>
                          <CitySelector
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('senderLat', undefined);
                              form.setValue('senderLng', undefined);
                            }}
                            label=""
                            placeholder="Choisir une ville"
                            triggerClassName="border-border bg-card h-10 text-xs w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Adresse *</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          {...field}
                          cityContext={watchedValues.senderCity}
                          placeholder="Rue, Quartier..."
                          onSelectAddress={(addr) => {
                            form.setValue('senderLat', addr.lat);
                            form.setValue('senderLng', addr.lng);
                          }}
                          isLoading={senderGeocode.isLoading}
                          className="h-10 border-border bg-card text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* RECEIVER CARD */}
            <Card className="border border-border bg-card rounded-lg shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Informations Destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Nom Complet *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Nom du destinataire" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Téléphone *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="06XX XXX XXX" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Ville de destination *</FormLabel>
                        <FormControl>
                          <CitySelector
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('receiverLat', undefined);
                              form.setValue('receiverLng', undefined);
                            }}
                            label=""
                            placeholder="Choisir une ville"
                            triggerClassName="border-border bg-card h-10 text-xs w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiverAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Adresse de livraison *</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          {...field}
                          cityContext={watchedValues.receiverCity}
                          placeholder="Rue, Quartier..."
                          onSelectAddress={(addr) => {
                            form.setValue('receiverLat', addr.lat);
                            form.setValue('receiverLng', addr.lng);
                          }}
                          isLoading={receiverGeocode.isLoading}
                          className="h-10 border-border bg-card text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Parcel + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: Parcel Info */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-border bg-card rounded-lg shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 p-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Détails de l'Expédition
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="packageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Description de l'article *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Ex: Vêtements, Électronique, Documents..." className="pl-9 h-10 border-border bg-card text-sm" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="packageWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Poids (KG) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type="number" step="0.1" placeholder="0.0" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Type de Colis</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-border bg-card h-10 text-xs">
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="Parcel" className="text-xs">Colis</SelectItem>
                              <SelectItem value="Document" className="text-xs">Documents</SelectItem>
                              <SelectItem value="Pallet" className="text-xs">Palette</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryOption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Option Logistique</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-border bg-card h-10 text-xs">
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="standard" className="text-xs">Standard</SelectItem>
                              <SelectItem value="express" className="text-xs">Express</SelectItem>
                              <SelectItem value="sameday" className="text-xs">Même Jour</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Méthode de Paiement</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-border bg-card h-10 text-xs">
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="CASH_ON_DELIVERY" className="text-xs">Paiement à la livraison (COD)</SelectItem>
                              <SelectItem value="PREPAID" className="text-xs">Déjà payé (Prepaid)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedValues.paymentMethod === 'CASH_ON_DELIVERY' && (
                      <FormField
                        control={form.control}
                        name="codAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-muted-foreground">Montant COD à Encaisser (MAD)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9 h-10 border-border bg-card text-sm font-semibold" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="pt-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Notes & Instructions de livraison</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instructions particulières pour le livreur..."
                              className="min-h-[80px] bg-card border-border rounded-lg text-xs resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Summary HUD */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-border bg-card rounded-lg shadow-sm p-6 space-y-6 sticky top-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">Récapitulatif Financier</h3>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Distance Estimée</span>
                    <span className="text-foreground">{routeInfo?.distance || "0 km"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Option Expédition</span>
                    <span className="text-foreground capitalize">{watchedValues.deliveryOption}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Facturation</span>
                    <span className="text-foreground">
                      {watchedValues.paymentMethod === 'PREPAID' ? 'Prépayé (Solde)' : 'À la livraison (COD)'}
                    </span>
                  </div>
                </div>

                <Separator className="bg-border" />

                {watchedValues.paymentMethod === 'CASH_ON_DELIVERY' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-muted-foreground">Frais Logistique</span>
                      <span className="text-foreground">{pricing.total.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-muted-foreground">Valeur Article</span>
                      <span className="text-foreground">{(parseFloat(watchedValues.codAmount || "0")).toFixed(2)} MAD</span>
                    </div>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-1">Total à collecter</p>
                      <p className="text-3xl font-extrabold text-primary">
                        {(pricing.total + parseFloat(watchedValues.codAmount || "0")).toFixed(2)} <span className="text-sm font-normal">MAD</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Frais Logistique</p>
                    <p className="text-3xl font-extrabold text-foreground">
                      {pricing.total.toFixed(2)} <span className="text-sm font-normal">MAD</span>
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || authLoading || !isAuthenticated || senderGeocode.isLoading || receiverGeocode.isLoading}
                  className="w-full mt-4"
                >
                  {loading ? "Création en cours..." : "Valider & Expédier"}
                </Button>
              </Card>
            </div>

          </div>

        </form>
      </Form>
    </div>
  );
};

export default CreateOrder;

