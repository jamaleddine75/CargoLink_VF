import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Settings, 
  Zap, 
  Truck, 
  Percent, 
  MapPin, 
  ShieldCheck, 
  Loader2, 
  Save, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Package,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { cn } from "@/lib/utils";

const PricingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<unknown>({
    baseDeliveryFee: 10,
    pricePerKm: 2.5,
    codHandlingFee: 3,
    urgentDeliveryFee: 10,
    heavyPackageFee: 7,
    earningsModel: 'DISTANCE',
    driverPercentage: 0.7,
    driverBaseFee: 8,
    driverRatePerKm: 1.8
  });

  // Simulation state
  const [simDistance, setSimDistance] = useState(8);
  const [simExtras, setSimExtras] = useState({ cod: true, urgent: false, heavy: false });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCurrentPricingConfig();
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch pricing config", error);
      toast.error("Impossible de charger la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updatePricingConfig(config);
      toast.success("Configuration de tarification mise à jour !");
    } catch (error) {
      toast.error("Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // Calculation Logic for Simulation
  const calcClientPrice = () => {
    let price = config.baseDeliveryFee + (simDistance * config.pricePerKm);
    if (simExtras.cod) price += config.codHandlingFee;
    if (simExtras.urgent) price += config.urgentDeliveryFee;
    if (simExtras.heavy) price += config.heavyPackageFee;
    return price;
  };

  const calcDriverEarnings = (clientPrice: number) => {
    if (config.earningsModel === 'PERCENTAGE') {
      return clientPrice * config.driverPercentage;
    }
    return config.driverBaseFee + (simDistance * config.driverRatePerKm);
  };

  const clientPrice = calcClientPrice();
  const driverEarnings = calcDriverEarnings(clientPrice);
  const platformMargin = clientPrice - driverEarnings;
  const marginPercent = (platformMargin / clientPrice) * 100;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chargement de la tarification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-none">
            Tarification <span className="text-indigo-600">& Gains</span>
          </h1>
          <p className="text-muted-foreground/70 dark:text-muted-foreground mt-3 font-bold uppercase text-[10px] tracking-[0.2em]">
            Configuration dynamique des prix clients et commissions chauffeurs (MAD)
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-foreground font-black uppercase text-xs tracking-widest px-8 h-14 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Sauvegarder les Tarifs
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Configs */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Client Pricing Section */}
          <Card className="border-none bg-white dark:bg-card shadow-xl p-8 rounded-[2.5rem] overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Tarification Client</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prix facturé à l'expéditeur</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frais de Base (MAD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="number" 
                    value={config.baseDeliveryFee}
                    onChange={(e) => setConfig({...config, baseDeliveryFee: Number(e.target.value)})}
                    className="h-14 pl-12 rounded-2xl border-2 font-black text-lg focus:border-indigo-600 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prix par KM (MAD/km)</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="number" 
                    value={config.pricePerKm}
                    onChange={(e) => setConfig({...config, pricePerKm: Number(e.target.value)})}
                    className="h-14 pl-12 rounded-2xl border-2 font-black text-lg focus:border-indigo-600 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                   <Zap className="w-3 h-3" /> Suppléments Optionnels
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { id: 'codHandlingFee', label: 'Gestion COD', icon: DollarSign },
                        { id: 'urgentDeliveryFee', label: 'Livraison Urgente', icon: Clock },
                        { id: 'heavyPackageFee', label: 'Colis Lourd', icon: Package },
                    ].map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent hover:border-indigo-100 transition-all">
                             <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">{item.label}</Label>
                             <div className="relative">
                                <item.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                <Input 
                                    type="number" 
                                    value={config[item.id]}
                                    onChange={(e) => setConfig({...config, [item.id]: Number(e.target.value)})}
                                    className="h-10 pl-9 rounded-xl border-none bg-white dark:bg-card font-bold shadow-sm" 
                                />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
          </Card>

          {/* Driver Earnings Section */}
          <Card className="border-none bg-white dark:bg-card shadow-xl p-8 rounded-[2.5rem] overflow-hidden relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Modèle de Gain Chauffeur</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rémunération des livreurs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modèle de Calcul</Label>
                        <Select 
                            value={config.earningsModel} 
                            onValueChange={(val) => setConfig({...config, earningsModel: val})}
                        >
                            <SelectTrigger className="h-14 rounded-2xl border-2 font-black text-lg focus:ring-emerald-600 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="PERCENTAGE" className="font-bold">Pourcentage (%)</SelectItem>
                                <SelectItem value="DISTANCE" className="font-bold">Basé sur Distance (Distance + Fixe)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={cn(
                        "p-6 rounded-[2rem] border-2 transition-all duration-500",
                        config.earningsModel === 'PERCENTAGE' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20" : "bg-slate-50 border-transparent opacity-40 grayscale pointer-events-none"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Part Chauffeur (%)</Label>
                            <span className="text-xl font-black text-emerald-600">{Math.round(config.driverPercentage * 100)}%</span>
                        </div>
                        <Input 
                            type="number" 
                            step="0.01"
                            value={config.driverPercentage}
                            onChange={(e) => setConfig({...config, driverPercentage: Number(e.target.value)})}
                            className="h-12 rounded-xl border-none shadow-sm font-bold text-center" 
                        />
                        <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-tight mt-3">Le chauffeur reçoit {Math.round(config.driverPercentage * 100)}% du total payé par le client.</p>
                    </div>
                </div>

                <div className={cn(
                    "p-8 rounded-[2rem] border-2 transition-all duration-500 space-y-6",
                    config.earningsModel === 'DISTANCE' ? "bg-amber-50 border-amber-100 dark:bg-amber-950/20" : "bg-slate-50 border-transparent opacity-40 grayscale pointer-events-none"
                )}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Paramètres Distance
                    </h4>
                    
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frais Fixe Chauffeur (MAD)</Label>
                        <Input 
                            type="number" 
                            value={config.driverBaseFee}
                            onChange={(e) => setConfig({...config, driverBaseFee: Number(e.target.value)})}
                            className="h-12 rounded-xl border-none shadow-sm font-bold text-lg" 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Taux KM Chauffeur (MAD/km)</Label>
                        <Input 
                            type="number" 
                            value={config.driverRatePerKm}
                            onChange={(e) => setConfig({...config, driverRatePerKm: Number(e.target.value)})}
                            className="h-12 rounded-xl border-none shadow-sm font-bold text-lg" 
                        />
                    </div>
                </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-[0.03]" />
          </Card>
        </div>

        {/* Right Column: Simulation & Insights */}
        <div className="xl:col-span-4 space-y-8">
            {/* Simulation Tool */}
            <Card className="border-none bg-slate-900 text-foreground shadow-2xl p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Simulateur de Prix</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-10">Tester la rentabilité en direct</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Distance (km)</Label>
                                <span className="text-xl font-black">{simDistance} KM</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                value={simDistance} 
                                onChange={(e) => setSimDistance(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'cod', label: 'Avec COD', key: 'cod' },
                                { id: 'urgent', label: 'Urgente', key: 'urgent' },
                                { id: 'heavy', label: 'Colis Lourd', key: 'heavy' },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-accent/30 border border-white/10">
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                                    <Switch 
                                        checked={(simExtras as unknown)[item.key]} 
                                        onCheckedChange={(val) => setSimExtras({...simExtras, [item.key]: val})}
                                        className="data-[state=checked]:bg-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-muted-foreground uppercase font-black text-[10px] tracking-widest">
                                <span>Prix Client</span>
                                <span className="text-foreground text-lg">{clientPrice.toFixed(2)} MAD</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground uppercase font-black text-[10px] tracking-widest">
                                <span>Gain Chauffeur</span>
                                <span className="text-emerald-400 text-lg">{driverEarnings.toFixed(2)} MAD</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 mb-1">Marge Plateforme</span>
                                    <span className="text-2xl font-black tracking-tighter">{platformMargin.toFixed(2)} MAD</span>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-xl font-black text-xs",
                                    marginPercent >= 20 && marginPercent <= 35 ? "bg-emerald-500 text-foreground" : "bg-rose-500 text-foreground"
                                )}>
                                    {marginPercent.toFixed(1)}%
                                </div>
                            </div>
                            { (marginPercent < 20 || marginPercent > 35) && (
                                <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 items-start">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-bold text-amber-500 uppercase leading-tight">Attention : La marge est hors de la recommandation de 20-35%.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Background effects */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp className="w-32 h-32" />
                </div>
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-30" />
            </Card>

            {/* Quick Tips */}
            <Card className="border-none bg-card shadow-xl p-8 rounded-[2.5rem]">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Conseils de Gestion
                </h4>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/70 leading-relaxed italic">"Le modèle par distance est plus équitable pour les chauffeurs en zone urbaine dense."</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/70 leading-relaxed italic">"Ajustez les suppléments pendant les périodes de forte demande pour booster vos revenus."</p>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;
