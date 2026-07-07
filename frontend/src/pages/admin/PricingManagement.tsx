import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Zap, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Loader2, 
  Save, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Package,
  Clock,
  CheckCircle2,
  Gauge,
  Shield,
  Route,
  BarChart3,
  ArrowUpRight,
  Users,
  Building2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

interface PricingConfig {
  baseDeliveryFee: number;
  pricePerKm: number;
  distanceThresholdKm: number;
  maxDeliveryFee: number;
  maxServiceDistanceKm: number;
  codHandlingFee: number;
  urgentDeliveryFee: number;
  heavyPackageFee: number;
  earningsModel: 'DISTANCE' | 'PERCENTAGE';
  driverPercentage: number;
  driverBaseFee: number;
  driverRatePerKm: number;
}

const DEFAULT_CONFIG: PricingConfig = {
  baseDeliveryFee: 15,
  pricePerKm: 2,
  distanceThresholdKm: 5,
  maxDeliveryFee: 45,
  maxServiceDistanceKm: 40,
  codHandlingFee: 3,
  urgentDeliveryFee: 10,
  heavyPackageFee: 7,
  earningsModel: 'DISTANCE',
  driverPercentage: 0.7,
  driverBaseFee: 8,
  driverRatePerKm: 1.8
};

const PricingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_CONFIG);

  // Simulation state
  const [simDistance, setSimDistance] = useState(8);
  const [simExtras, setSimExtras] = useState({ cod: true, urgent: false, heavy: false });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCurrentPricingConfig() as PricingConfig;
      setConfig({ ...DEFAULT_CONFIG, ...data });
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

  // Simulation logic — uses config fields, not hardcoded values
  const calcClientPrice = (): number => {
    const maxDist = config.maxServiceDistanceKm ?? 40;
    const distance = Math.min(Math.max(simDistance, 0), maxDist);
    const threshold = config.distanceThresholdKm ?? 5;
    const baseFee = config.baseDeliveryFee ?? 15;
    const ratePerKm = config.pricePerKm ?? 2;
    const maxFee = config.maxDeliveryFee ?? 45;
    
    let price = baseFee + Math.max(distance - threshold, 0) * ratePerKm;
    if (simExtras.cod) price += config.codHandlingFee ?? 0;
    if (simExtras.urgent) price += config.urgentDeliveryFee ?? 0;
    if (simExtras.heavy) price += config.heavyPackageFee ?? 0;
    return Math.min(price, maxFee);
  };

  const calcDriverEarnings = (clientPrice: number, dist: number = simDistance): number => {
    if (config.earningsModel === 'PERCENTAGE') {
      return clientPrice * (config.driverPercentage ?? 0);
    }
    return (config.driverBaseFee ?? 0) + (dist * (config.driverRatePerKm ?? 0));
  };

  const clientPrice = calcClientPrice();
  const driverEarnings = calcDriverEarnings(clientPrice);
  const platformMargin = clientPrice - driverEarnings;
  const marginPercent = clientPrice > 0 ? (platformMargin / clientPrice) * 100 : 0;

  const simDistanceExceedsMax = simDistance > (config.maxServiceDistanceKm ?? 40);

  // --- Margin analytics: compute for 3 representative scenarios ---
  const computeScenario = (distKm: number) => {
    const threshold = config.distanceThresholdKm ?? 5;
    const baseFee = config.baseDeliveryFee ?? 15;
    const ratePerKm = config.pricePerKm ?? 2;
    const maxFee = config.maxDeliveryFee ?? 45;
    const price = Math.min(baseFee + Math.max(distKm - threshold, 0) * ratePerKm, maxFee);
    const driver = config.earningsModel === 'PERCENTAGE'
      ? price * (config.driverPercentage ?? 0)
      : (config.driverBaseFee ?? 0) + distKm * (config.driverRatePerKm ?? 0);
    const margin = price - driver;
    const marginPct = price > 0 ? (margin / price) * 100 : 0;
    const driverPct = price > 0 ? (driver / price) * 100 : 0;
    return { price, driver, margin, marginPct, driverPct };
  };

  const scenarios = [
    { label: 'Court', sublabel: '3 km', km: 3, icon: '🏙️', color: 'indigo' },
    { label: 'Moyen', sublabel: '12 km', km: 12, icon: '🚚', color: 'violet' },
    { label: 'Long', sublabel: '30 km', km: 30, icon: '🛣️', color: 'rose' },
  ].map(s => ({ ...s, ...computeScenario(s.km) }));

  // Weighted average margin across 3 scenarios
  const avgMarginPct = scenarios.reduce((acc, s) => acc + s.marginPct, 0) / scenarios.length;
  const avgDriverPct = scenarios.reduce((acc, s) => acc + s.driverPct, 0) / scenarios.length;
  const marginStatus = avgMarginPct >= 20 && avgMarginPct <= 35 ? 'ok' : avgMarginPct < 20 ? 'low' : 'high';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chargement de la tarification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-none">
            Tarification <span className="text-indigo-600">&amp; Gains</span>
          </h1>
          <p className="text-muted-foreground/70 dark:text-muted-foreground mt-3 font-bold uppercase text-[10px] tracking-[0.2em]">
            Configuration dynamique des prix clients et commissions chauffeurs (MAD)
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest px-8 h-14 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Sauvegarder les Tarifs
        </Button>
      </div>

      {/* ─── Marges & Statistiques ─────────────────────────────── */}
      <div className="space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Platform margin % */}
          <Card className={cn(
            "border-none shadow-lg p-5 rounded-[2rem] flex flex-col gap-2 relative overflow-hidden",
            marginStatus === 'ok' ? "bg-emerald-600" : marginStatus === 'low' ? "bg-rose-600" : "bg-amber-500"
          )}>
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <Badge className={cn(
                "text-[8px] font-black uppercase px-2 py-0.5 border-0",
                marginStatus === 'ok' ? "bg-emerald-800/40 text-white" : "bg-black/20 text-white"
              )}>
                {marginStatus === 'ok' ? '✓ Optimal' : marginStatus === 'low' ? '↓ Trop bas' : '↑ Trop élevé'}
              </Badge>
            </div>
            <div>
              <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Marge Plateforme Moy.</p>
              <p className="text-white text-3xl font-black tracking-tighter">{avgMarginPct.toFixed(1)}<span className="text-xl">%</span></p>
            </div>
            <p className="text-white/60 text-[9px] font-bold">Recommandé : 20–35%</p>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          </Card>

          {/* Driver share */}
          <Card className="border-none shadow-lg p-5 rounded-[2rem] flex flex-col gap-2 bg-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Part Chauffeur Moy.</p>
              <p className="text-white text-3xl font-black tracking-tighter">{avgDriverPct.toFixed(1)}<span className="text-xl">%</span></p>
            </div>
            <p className="text-slate-500 text-[9px] font-bold">
              {config.earningsModel === 'PERCENTAGE' ? `${(config.driverPercentage * 100).toFixed(0)}% du prix client` : 'Base + km'}
            </p>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          </Card>

          {/* Revenue per delivery (mid scenario) */}
          <Card className="border-none shadow-lg p-5 rounded-[2rem] flex flex-col gap-2 bg-white dark:bg-card relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[9px] font-black uppercase text-muted-foreground">12 km</span>
            </div>
            <div>
              <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest">Revenu Livraison Type</p>
              <p className="text-foreground text-3xl font-black tracking-tighter">{scenarios[1].price.toFixed(0)}<span className="text-base text-muted-foreground font-bold"> MAD</span></p>
            </div>
            <p className="text-muted-foreground text-[9px] font-bold">Chauffeur: {scenarios[1].driver.toFixed(2)} MAD · Plateforme: {scenarios[1].margin.toFixed(2)} MAD</p>
          </Card>

          {/* Max fee cap */}
          <Card className="border-none shadow-lg p-5 rounded-[2rem] flex flex-col gap-2 bg-white dark:bg-card relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-[9px] font-black uppercase text-muted-foreground">Plafond</span>
            </div>
            <div>
              <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest">Frais Max Client</p>
              <p className="text-foreground text-3xl font-black tracking-tighter">{config.maxDeliveryFee}<span className="text-base text-muted-foreground font-bold"> MAD</span></p>
            </div>
            <p className="text-muted-foreground text-[9px] font-bold">Zone: {config.maxServiceDistanceKm} km · Seuil: {config.distanceThresholdKm} km gratuit</p>
          </Card>
        </div>

        {/* Scenario Margin Breakdown */}
        <Card className="border-none shadow-lg p-6 rounded-[2rem] bg-white dark:bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight">Répartition des Marges par Scénario</h4>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Livraison standard sans extras · Mise à jour en temps réel</p>
            </div>
          </div>

          <div className="space-y-5">
            {scenarios.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <div>
                      <span className="text-xs font-black uppercase">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground font-bold ml-2">{s.sublabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black">
                    <span className="text-muted-foreground">Total: <span className="text-foreground">{s.price.toFixed(2)} MAD</span></span>
                    <span className="text-emerald-600">Chauffeur: {s.driver.toFixed(2)} MAD ({s.driverPct.toFixed(0)}%)</span>
                    <span className={s.marginPct >= 20 && s.marginPct <= 35 ? 'text-indigo-600' : 'text-rose-500'}>
                      Site: {s.margin.toFixed(2)} MAD ({s.marginPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                {/* Stacked bar */}
                <div className="h-6 rounded-xl overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700 flex items-center justify-center"
                    style={{ width: `${s.driverPct}%` }}
                  >
                    {s.driverPct > 15 && <span className="text-white text-[9px] font-black">{s.driverPct.toFixed(0)}%</span>}
                  </div>
                  <div
                    className={cn(
                      "h-full transition-all duration-700 flex items-center justify-center",
                      s.marginPct >= 20 && s.marginPct <= 35 ? "bg-indigo-500" : s.marginPct < 20 ? "bg-rose-500" : "bg-amber-500"
                    )}
                    style={{ width: `${s.marginPct}%` }}
                  >
                    {s.marginPct > 10 && <span className="text-white text-[9px] font-black">{s.marginPct.toFixed(0)}%</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Chauffeur</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Plateforme (optimal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Plateforme (hors zone)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Non alloué</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* ──────────────────────────────────────────────────────── */}

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

            {/* Core Rates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frais de Base (MAD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="number" 
                    step="0.5"
                    value={config.baseDeliveryFee}
                    onChange={(e) => setConfig({...config, baseDeliveryFee: Number(e.target.value)})}
                    className="h-14 pl-12 rounded-2xl border-2 font-black text-lg focus:border-indigo-600 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prix par KM au-delà du seuil (MAD/km)</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="number" 
                    step="0.5"
                    value={config.pricePerKm}
                    onChange={(e) => setConfig({...config, pricePerKm: Number(e.target.value)})}
                    className="h-14 pl-12 rounded-2xl border-2 font-black text-lg focus:border-indigo-600 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Distance Limits Row */}
            <div className="mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-5 flex items-center gap-2">
                <Route className="w-3 h-3" /> Règles de Distance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border-2 border-violet-100 dark:border-violet-900/30 space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-violet-600 block">
                    Seuil Distance Gratuite (km)
                  </Label>
                  <div className="relative">
                    <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-300" />
                    <Input 
                      type="number" 
                      step="0.5"
                      value={config.distanceThresholdKm}
                      onChange={(e) => setConfig({...config, distanceThresholdKm: Number(e.target.value)})}
                      className="h-10 pl-9 rounded-xl border-none bg-white dark:bg-card font-bold shadow-sm" 
                    />
                  </div>
                  <p className="text-[8px] text-violet-500 font-bold uppercase">Frais de distance appliqués après ce seuil</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-rose-600 block">
                    Plafond Frais Livraison (MAD)
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-300" />
                    <Input 
                      type="number" 
                      step="1"
                      value={config.maxDeliveryFee}
                      onChange={(e) => setConfig({...config, maxDeliveryFee: Number(e.target.value)})}
                      className="h-10 pl-9 rounded-xl border-none bg-white dark:bg-card font-bold shadow-sm" 
                    />
                  </div>
                  <p className="text-[8px] text-rose-500 font-bold uppercase">Montant maximum facturé au client</p>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-100 dark:border-orange-900/30 space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-orange-600 block">
                    Distance Max Service (km)
                  </Label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-300" />
                    <Input 
                      type="number" 
                      step="1"
                      value={config.maxServiceDistanceKm}
                      onChange={(e) => setConfig({...config, maxServiceDistanceKm: Number(e.target.value)})}
                      className="h-10 pl-9 rounded-xl border-none bg-white dark:bg-card font-bold shadow-sm" 
                    />
                  </div>
                  <p className="text-[8px] text-orange-500 font-bold uppercase">Commandes refusées au-delà de cette distance</p>
                </div>
              </div>
            </div>

            {/* Optional Surcharges */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-5 flex items-center gap-2">
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
                        step="0.5"
                        value={(config as Record<string, number>)[item.id]}
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
                    onValueChange={(val: 'DISTANCE' | 'PERCENTAGE') => setConfig({...config, earningsModel: val})}
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
                    step="0.5"
                    value={config.driverBaseFee}
                    onChange={(e) => setConfig({...config, driverBaseFee: Number(e.target.value)})}
                    className="h-12 rounded-xl border-none shadow-sm font-bold text-lg" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Taux KM Chauffeur (MAD/km)</Label>
                  <Input 
                    type="number"
                    step="0.1"
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
          <Card className="border-none bg-slate-900 text-white shadow-2xl p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-1">Simulateur de Prix</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">Tester la rentabilité en direct</p>
              
              <div className="space-y-6">
                {/* Distance slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Distance (km)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black">{simDistance} KM</span>
                      {simDistanceExceedsMax && (
                        <Badge className="bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5">
                          Hors zone
                        </Badge>
                      )}
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="60" 
                    value={simDistance} 
                    onChange={(e) => setSimDistance(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>1 km</span>
                    <span className="text-orange-400">Max: {config.maxServiceDistanceKm} km</span>
                    <span>60 km</span>
                  </div>
                </div>

                {/* Extras toggles */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'cod', label: 'Avec COD', key: 'cod' as const, fee: config.codHandlingFee },
                    { id: 'urgent', label: 'Urgente', key: 'urgent' as const, fee: config.urgentDeliveryFee },
                    { id: 'heavy', label: 'Colis Lourd', key: 'heavy' as const, fee: config.heavyPackageFee },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-white/10">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                        <span className="text-[9px] text-slate-400 font-bold ml-2">+{item.fee} MAD</span>
                      </div>
                      <Switch 
                        checked={simExtras[item.key]} 
                        onCheckedChange={(val) => setSimExtras({...simExtras, [item.key]: val})}
                        className="data-[state=checked]:bg-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="pt-6 mt-2 border-t border-white/10 space-y-4">
                  {simDistanceExceedsMax ? (
                    <div className="flex gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 items-start">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-rose-400 uppercase leading-tight">
                        Distance ({simDistance} km) supérieure à la limite de service ({config.maxServiceDistanceKm} km). La commande serait refusée.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Price breakdown */}
                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Frais de base</span>
                          <span>{config.baseDeliveryFee.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Frais distance ({Math.max(simDistance - config.distanceThresholdKm, 0).toFixed(1)} km × {config.pricePerKm} MAD)</span>
                          <span>+{(Math.max(simDistance - config.distanceThresholdKm, 0) * config.pricePerKm).toFixed(2)} MAD</span>
                        </div>
                        {simExtras.cod && <div className="flex justify-between text-slate-400"><span>COD</span><span>+{config.codHandlingFee.toFixed(2)} MAD</span></div>}
                        {simExtras.urgent && <div className="flex justify-between text-slate-400"><span>Urgence</span><span>+{config.urgentDeliveryFee.toFixed(2)} MAD</span></div>}
                        {simExtras.heavy && <div className="flex justify-between text-slate-400"><span>Colis lourd</span><span>+{config.heavyPackageFee.toFixed(2)} MAD</span></div>}
                        {clientPrice >= config.maxDeliveryFee && (
                          <div className="flex justify-between text-rose-400 text-[9px]">
                            <span>Plafond appliqué</span>
                            <span>max {config.maxDeliveryFee} MAD</span>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="flex justify-between items-center uppercase font-black text-[10px] tracking-widest text-slate-400">
                        <span>Prix Client</span>
                        <span className="text-white text-lg">{clientPrice.toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between items-center uppercase font-black text-[10px] tracking-widest text-slate-400">
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
                          marginPercent >= 20 && marginPercent <= 35 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {marginPercent.toFixed(1)}%
                        </div>
                      </div>
                      { (marginPercent < 20 || marginPercent > 35) && (
                        <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-bold text-amber-500 uppercase leading-tight">Attention : La marge est hors de la recommandation de 20–35%.</p>
                        </div>
                      )}
                    </>
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
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-muted-foreground/70 leading-relaxed italic">"Augmentez le seuil de distance gratuite pour attirer plus de clients en zone proche."</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;
