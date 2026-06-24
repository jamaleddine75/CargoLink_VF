import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  ArrowRight,
  User, 
  MapPin, 
  Package, 
  Truck,
  Phone,
  Hash,
  Scale,
  DollarSign,
  Info,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  ChevronRight,
  ChevronLeft,
  Settings2,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { CreateOrderRequest } from '@/types';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import StepProgress from '@/components/agency/orders/StepProgress';
import MapPicker from '@/components/maps/MapPicker';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';

const formSchema = z.object({
  // Step 1: Lieux
  senderName: z.string().min(2, "Nom de l'expéditeur requis"),
  senderPhone: z.string().min(8, "Numéro de téléphone invalide"),
  senderCity: z.string().min(2, "Ville requise"),
  senderAddress: z.string().min(5, "Adresse requise"),
  senderLat: z.number().optional(),
  senderLng: z.number().optional(),
  
  receiverName: z.string().min(2, "Nom du destinataire requis"),
  receiverPhone: z.string().min(8, "Numéro de téléphone invalide"),
  receiverCity: z.string().min(2, "Ville requise"),
  receiverAddress: z.string().min(5, "Adresse de livraison requise"),
  receiverLat: z.number().optional(),
  receiverLng: z.number().optional(),

  // Step 2: Colis
  packageName: z.string().min(2, "Description du colis requise"),
  packageWeight: z.string().optional(),
  packageQuantity: z.string().default("1"),
  packageType: z.string().default("STANDARD"),

  // Step 3: Options
  paymentMethod: z.string().default("CASH_ON_DELIVERY"),
  codAmount: z.string().min(1, "Montant COD requis"),
  urgent: z.boolean().default(false),
  heavy: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 'lieux', title: 'Lieux', icon: <MapPin className="w-5 h-5" /> },
  { id: 'colis', title: 'Colis', icon: <Package className="w-5 h-5" /> },
  { id: 'options', title: 'Options', icon: <Settings2 className="w-5 h-5" /> },
  { id: 'validation', title: 'Validation', icon: <ShieldCheck className="w-5 h-5" /> },
];

const AgencyCreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapFocus, setMapFocus] = useState<'sender' | 'receiver'>('sender');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderCity: "TANGER",
      receiverCity: "",
      packageQuantity: "1",
      packageType: "STANDARD",
      urgent: false,
      heavy: false,
      paymentMethod: "CASH_ON_DELIVERY",
      codAmount: "0",
    },
  });

  const watchedValues = form.watch();

  const handleNext = async () => {
    const fieldsToValidate: (keyof FormValues)[] = [];
    
    if (currentStep === 0) {
      fieldsToValidate.push(
        'senderName', 'senderPhone', 'senderCity', 'senderAddress',
        'receiverName', 'receiverPhone', 'receiverCity', 'receiverAddress'
      );
    } else if (currentStep === 1) {
      fieldsToValidate.push('packageName', 'packageWeight', 'packageQuantity');
    } else if (currentStep === 2) {
      fieldsToValidate.push('codAmount');
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload: CreateOrderRequest = {
        pickupAddress: values.senderAddress,
        pickupContactName: values.senderName,
        pickupContactPhone: values.senderPhone,
        senderCity: values.senderCity,
        pickupLat: values.senderLat,
        pickupLng: values.senderLng,
        
        deliveryAddress: values.receiverAddress,
        receiverName: values.receiverName,
        receiverPhone: values.receiverPhone,
        receiverCity: values.receiverCity,
        deliveryLat: values.receiverLat,
        deliveryLng: values.receiverLng,
        
        codAmount: parseFloat(values.codAmount) || 0,
        deliveryNotes: values.notes,
        urgent: values.urgent,
        heavy: values.heavy,
        clientName: values.senderName,
        packageName: values.packageName,
        packageWeight: values.packageWeight ? parseFloat(values.packageWeight) : undefined,
        packageQuantity: parseInt(values.packageQuantity),
      };

      await agencyService.createOrder(payload);
      toast.success("Expédition créée avec succès !");
      navigate('/agency/orders');
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Échec de la création de l'expédition.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const cardShell = 'border border-border/40 bg-slate-950/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 shrink-0 h-12 w-12"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Nouvelle expédition <span className="text-blue-500">(Agence)</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Remplissez les informations pour créer un nouveau bon d'expédition.
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
            <div className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              Draft
            </div>
          </div>
        </header>

        <StepProgress currentStep={currentStep} steps={STEPS} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Form Content */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <Card className={cardShell}>
                        <CardHeader className="border-b border-white/5 bg-white/5">
                          <CardTitle className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                              <MapPin className="w-5 h-5 text-blue-500" />
                            </div>
                            Points d'Expédition & Livraison
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                          {/* Sender Section */}
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
                                        <Input placeholder="Nom du client" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-blue-500/30 transition-all" {...field} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                          <SelectValue placeholder="Ville d'origine" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="TANGER">Tanger</SelectItem>
                                        <SelectItem value="TETOUAN">Tetouan</SelectItem>
                                        <SelectItem value="CASABLANCA">Casablanca</SelectItem>
                                        <SelectItem value="RABAT">Rabat</SelectItem>
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

                          {/* Receiver Section */}
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                          <SelectValue placeholder="Choisir une ville" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="TANGER">Tanger</SelectItem>
                                        <SelectItem value="TETOUAN">Tetouan</SelectItem>
                                        <SelectItem value="CASABLANCA">Casablanca</SelectItem>
                                        <SelectItem value="RABAT">Rabat</SelectItem>
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

                          {/* Map Section */}
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <LocateFixed className="w-4 h-4 text-blue-500" />
                                Localisation sur la carte
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
                              className="h-[350px] w-full rounded-2xl"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <Card className={cardShell}>
                        <CardHeader className="border-b border-white/5 bg-white/5">
                          <CardTitle className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center border border-amber-500/20">
                              <Package className="w-5 h-5 text-amber-500" />
                            </div>
                            Détails du Colis
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
                                    <Input placeholder="Ex: Électronique, Vêtements, Documents..." className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-amber-500/30 text-lg" {...field} />
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
                                  <FormLabel className="text-slate-400 font-bold">Poids Estimé (KG)</FormLabel>
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
                              name="packageQuantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400 font-bold">Nombre de colis</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                      <Input type="number" min="1" placeholder="1" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-amber-500/30" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="packageType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400 font-bold">Type d'expédition</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                      <SelectValue placeholder="Standard" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-slate-900 border-white/10">
                                    <SelectItem value="STANDARD">Colis Standard</SelectItem>
                                    <SelectItem value="DOCUMENT">Documents</SelectItem>
                                    <SelectItem value="FRAGILE">Fragile / Spécial</SelectItem>
                                    <SelectItem value="HEAVY">Lourd / Encombrant</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <Card className={cardShell}>
                        <CardHeader className="border-b border-white/5 bg-white/5">
                          <CardTitle className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                              <Settings2 className="w-5 h-5 text-purple-500" />
                            </div>
                            Options & Paiement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400 font-bold">Méthode de Paiement</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-slate-300">
                                        <SelectValue placeholder="Choisir" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                      <SelectItem value="CASH_ON_DELIVERY">Paiement à la livraison (COD)</SelectItem>
                                      <SelectItem value="PREPAID">Déjà payé (Prepaid)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="codAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400 font-bold">Montant à Encaisser (MAD)</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                                      <Input type="number" placeholder="0.00" className="pl-12 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-purple-500/30 font-bold text-lg" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Options de traitement</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="urgent"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-white/10 p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-amber-500 border-white/20"
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-bold text-white cursor-pointer">Expédition Urgente</FormLabel>
                                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Priorité maximum</p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="heavy"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-white/10 p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-blue-500 border-white/20"
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-bold text-white cursor-pointer">Fragile / Lourd</FormLabel>
                                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Manipulation spéciale</p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400 font-bold">Instructions supplémentaires</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Ex: Code d'accès, instructions pour le livreur..." 
                                    className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/30 resize-none p-4" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <Card className={cardShell}>
                        <CardHeader className="border-b border-white/5 bg-white/5">
                          <CardTitle className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            Validation Finale
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Récapitulatif Itinéraire</h4>
                              <div className="relative pl-8 space-y-6">
                                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500 to-cyan-500" />
                                
                                <div className="relative">
                                  <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-[#020617] border-2 border-blue-500 z-10" />
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-500">EXPÉDITEUR</p>
                                    <p className="font-bold text-white">{watchedValues.senderName}</p>
                                    <p className="text-sm text-slate-400">{watchedValues.senderAddress}, {watchedValues.senderCity}</p>
                                  </div>
                                </div>

                                <div className="relative">
                                  <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-[#020617] border-2 border-cyan-500 z-10" />
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-cyan-500">DESTINATAIRE</p>
                                    <p className="font-bold text-white">{watchedValues.receiverName}</p>
                                    <p className="text-sm text-slate-400">{watchedValues.receiverAddress}, {watchedValues.receiverCity}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Détails Colis</h4>
                              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">Article:</span>
                                  <span className="font-bold text-white">{watchedValues.packageName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">Poids:</span>
                                  <span className="font-bold text-white">{watchedValues.packageWeight || '0'} KG</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">Quantité:</span>
                                  <span className="font-bold text-white">{watchedValues.packageQuantity} unité(s)</span>
                                </div>
                                <Separator className="bg-white/10" />
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">Type:</span>
                                  <Badge variant="outline" className="border-blue-500/20 text-blue-400">{watchedValues.packageType}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/20 text-white shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
                              <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Total à Encaisser (COD)</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                                    {watchedValues.codAmount || '0.00'}
                                  </span>
                                  <span className="text-xl font-bold text-slate-500 uppercase">mad</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Paiement à la livraison</span>
                                </div>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 sticky top-8 space-y-6">
              <Card className={`${cardShell} border-blue-500/20`}>
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500" />
                <CardHeader>
                  <CardTitle className="text-lg font-black text-white">Résumé du Paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Frais de livraison:</span>
                      <span className="font-bold text-white">Calcul en cours...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Méthode:</span>
                      <span className="font-bold text-blue-400">
                        {watchedValues.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'Prepaid'}
                      </span>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="p-6 rounded-[2rem] bg-[#0f172a] border border-blue-500/20 text-white shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
                      <div className="relative z-10 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Montant COD total</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black tracking-tighter text-white">
                            {watchedValues.codAmount || '0.00'}
                          </span>
                          <span className="text-sm font-bold text-slate-500">MAD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentStep < STEPS.length - 1 ? (
                      <Button 
                        type="button" 
                        onClick={handleNext}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 gap-2 group"
                      >
                        Continuer
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 gap-2"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Création...
                          </span>
                        ) : (
                          <>
                            <PackageCheck className="w-5 h-5" /> Confirmer & Créer
                          </>
                        )}
                      </Button>
                    )}
                    
                    {currentStep > 0 && (
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={handleBack}
                        className="w-full h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Retour
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-center p-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Paiement Sécurisé</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Conseil</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Précisez les coordonnées GPS pour une livraison plus rapide et éviter les erreurs d'adresse.
                </p>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
};

export default AgencyCreateOrder;
