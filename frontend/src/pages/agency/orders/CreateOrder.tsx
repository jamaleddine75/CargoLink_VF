import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Phone,
  Hash,
  Scale,
  DollarSign,
  LocateFixed,
  Settings2,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { CreateOrderRequest } from '@/types';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

import MapPicker from '@/components/maps/MapPicker';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';
import CitySelector from '@/components/common/CitySelector';
import { useReverseGeocoding } from '@/hooks/useReverseGeocoding';
import { getAvailableCities } from '@/services/api/publicService';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';

const formSchema = z.object({
  senderName: z.string().min(2, "Sender name is required"),
  senderPhone: z.string().min(8, "Invalid phone number"),
  senderCity: z.string().min(2, "City is required"),
  senderAddress: z.string().min(5, "Address is required"),
  senderLat: z.number().optional(),
  senderLng: z.number().optional(),

  receiverName: z.string().min(2, "Receiver name is required"),
  receiverPhone: z.string().min(8, "Invalid phone number"),
  receiverCity: z.string().min(2, "City is required"),
  receiverAddress: z.string().min(5, "Delivery address is required"),
  receiverLat: z.number().optional(),
  receiverLng: z.number().optional(),

  packageName: z.string().min(2, "Package description is required"),
  packageWeight: z.string().optional(),
  packageQuantity: z.string().default("1"),
  packageType: z.string().default("STANDARD"),

  paymentMethod: z.string().default("CASH_ON_DELIVERY"),
  codAmount: z.string().min(1, "COD amount is required"),
  urgent: z.boolean().default(false),
  heavy: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AgencyCreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapFocus, setMapFocus] = useState<'sender' | 'receiver'>('sender');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    getAvailableCities().then(setAvailableCities).catch(console.error);
  }, []);

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
        urgent: values.urgent,
        heavy: values.heavy,
        clientName: values.senderName,
        packageName: values.packageName,
        packageWeight: values.packageWeight ? parseFloat(values.packageWeight) : undefined,
        packageQuantity: parseInt(values.packageQuantity),
        // Map notes to the backend DTO field name
        ...(values.notes ? { notes: values.notes } : {}),
      };

      await agencyService.createOrder(payload);
      toast.success("Shipment created successfully!");
      navigate('/agency/orders');
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to create shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardShell = 'border border-border bg-card shadow-sm rounded-lg overflow-hidden';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-md border-border bg-card shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            New Shipment
          </h1>
          <p className="text-muted-foreground text-xs">
            Fill in the details to create a new shipping order.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">

          <Card className={cardShell}>
            <CardHeader className="border-b border-border bg-muted/30 p-4">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                Pickup & Delivery Points
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sender (Pickup)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Full Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Client name" className="pl-9 h-10 border-border bg-card" {...field} />
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
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Phone *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="+212 6XX XXX XXX" className="pl-9 h-10 border-border bg-card" {...field} />
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
                        <FormLabel className="text-xs font-semibold text-muted-foreground">City *</FormLabel>
                        <FormControl>
                          <CitySelector
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('senderLat', undefined);
                              form.setValue('senderLng', undefined);
                            }}
                            label=""
                            placeholder="Origin city"
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
                            placeholder="Street, District..."
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
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receiver (Delivery)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Full Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Receiver name" className="pl-9 h-10 border-border bg-card" {...field} />
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
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Phone *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="+212 6XX XXX XXX" className="pl-9 h-10 border-border bg-card" {...field} />
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
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Destination City *</FormLabel>
                        <FormControl>
                          <CitySelector
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('receiverLat', undefined);
                              form.setValue('receiverLng', undefined);
                            }}
                            label=""
                            placeholder="Select a city"
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
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Delivery Address *</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            {...field}
                            cityContext={watchedValues.receiverCity}
                            placeholder="Street, District..."
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
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <LocateFixed className="w-4 h-4 text-primary" />
                    Map Location
                  </h4>
                  <div className="flex gap-1 bg-muted p-1 rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setMapFocus('sender')}
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all ${mapFocus === 'sender' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Sender
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapFocus('receiver')}
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all ${mapFocus === 'receiver' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Receiver
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
                      senderGeocode.triggerGeocoding(lat, lng);
                    } else {
                      receiverGeocode.triggerGeocoding(lat, lng);
                    }
                  }}
                  className="h-[250px] w-full rounded-lg border border-border"
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cardShell}>
            <CardHeader className="border-b border-border bg-muted/30 p-4">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Item Description *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="E.g. Electronics, Clothing, Documents..." className="pl-9 h-10 border-border bg-card text-sm" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packageWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Estimated Weight (KG)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" step="0.1" placeholder="0.0" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">KG</span>
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Number of Packages</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" min="1" placeholder="1" className="pl-9 h-10 border-border bg-card text-sm" {...field} />
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
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Shipping Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-border bg-card h-10 text-xs">
                          <SelectValue placeholder="Standard" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="STANDARD" className="text-xs">Standard Package</SelectItem>
                        <SelectItem value="DOCUMENT" className="text-xs">Documents</SelectItem>
                        <SelectItem value="FRAGILE" className="text-xs">Fragile / Special</SelectItem>
                        <SelectItem value="HEAVY" className="text-xs">Heavy / Bulky</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className={cardShell}>
            <CardHeader className="border-b border-border bg-muted/30 p-4">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                Options & Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-border bg-card h-10 text-xs">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="CASH_ON_DELIVERY" className="text-xs">Cash on Delivery (COD)</SelectItem>
                          <SelectItem value="PREPAID" className="text-xs">Prepaid</SelectItem>
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground">COD Amount (MAD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="0.00" className="pl-9 h-10 border-border bg-card text-sm font-semibold" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Processing Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="urgent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border p-3.5 hover:bg-muted/50 transition-colors cursor-pointer bg-card">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                          <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">Urgent Shipment</FormLabel>
                          <p className="text-[9px] text-muted-foreground">Maximum priority</p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heavy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-border p-3.5 hover:bg-muted/50 transition-colors cursor-pointer bg-card">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                          <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">Heavy Package</FormLabel>
                          <p className="text-[9px] text-muted-foreground">Special handling</p>
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
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Additional Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g. Access code, instructions for the driver..."
                        className="min-h-[100px] border-border bg-card resize-none p-3 text-xs"
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
            disabled={isSubmitting || senderGeocode.isLoading || receiverGeocode.isLoading}
            className="w-full h-12 rounded-md font-semibold text-sm gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <PackageCheck className="w-5 h-5" /> Confirm & Create Shipment
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AgencyCreateOrder;
