import React from 'react';
import { 
  Package, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Zap, 
  Navigation, 
  ChevronRight,
  Info,
  DollarSign,
  User,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PricingResult } from '@/utils/pricing';

interface StepReviewProps {
  formData: any;
  routeInfo: { distance: string; time: string } | null;
  pricing: PricingResult;
  loading: boolean;
}

const cardShell = 'border border-border/60 bg-accent/20 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.10)]';

const StepReview: React.FC<StepReviewProps> = ({
  formData,
  routeInfo,
  pricing,
  loading
}) => {
  const { locations, parcel, attributes, options } = formData;

  const SummarySection = ({ icon: Icon, title, children, color = "blue" }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-600`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      <div className="p-4 rounded-2xl bg-background/50 border border-border/60 space-y-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Details */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Locations */}
          <div className="space-y-6">
            <SummarySection icon={MapPin} title="Itinéraire" color="blue">
              <div className="space-y-4 relative">
                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-dashed-gradient opacity-30" />
                
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase">Ramassage</p>
                    <p className="font-bold text-sm">{locations.sender.city}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{locations.sender.address}</p>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {locations.sender.name}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {locations.sender.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary uppercase">Livraison</p>
                    <p className="font-bold text-sm">{locations.receiver.city}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{locations.receiver.address}</p>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {locations.receiver.name}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {locations.receiver.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SummarySection>

            {routeInfo && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-background/50 border border-border/60 flex flex-col items-center">
                  <Navigation className="w-4 h-4 text-primary mb-1 opacity-50" />
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Distance</p>
                  <p className="text-lg font-black">{routeInfo.distance}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background/50 border border-border/60 flex flex-col items-center">
                  <Zap className="w-4 h-4 text-amber-500 mb-1 opacity-50" />
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Temps Est.</p>
                  <p className="text-lg font-black">{routeInfo.time}</p>
                </div>
              </div>
            )}
          </div>

          {/* Parcel & Options */}
          <div className="space-y-6">
            <SummarySection icon={Package} title="Détails du Colis" color="indigo">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground/70 uppercase">Type</p>
                  <p className="font-bold text-sm">{parcel.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground/70 uppercase">Poids Final</p>
                  <p className="font-bold text-sm">{pricing.finalWeight} kg</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border/60">
                <p className="text-[10px] font-black text-muted-foreground/70 uppercase mb-1">Dimensions</p>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-1 rounded-lg bg-accent/10">{parcel.dimensions.length}cm</span>
                  <ChevronRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 rounded-lg bg-accent/10">{parcel.dimensions.width}cm</span>
                  <ChevronRight className="w-3 h-3 opacity-30" />
                  <span className="px-2 py-1 rounded-lg bg-accent/10">{parcel.dimensions.height}cm</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {attributes.fragile && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] uppercase font-black">Fragile</Badge>}
                {attributes.liquid && <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] uppercase font-black">Liquide</Badge>}
                {pricing.volumetricWeight > pricing.realWeight && <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[8px] uppercase font-black">Volumineux</Badge>}
              </div>
            </SummarySection>

            <SummarySection icon={Truck} title="Options" color="emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground/70 uppercase">Vitesse</p>
                  <p className="font-bold text-sm capitalize">{options.deliveryOption.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground/70 uppercase">Assurance</p>
                  <p className="font-bold text-sm">{options.insurance.enabled ? "Activée" : "Non"}</p>
                </div>
              </div>
              {options.instructions && (
                <div className="pt-3 border-t border-border/60">
                  <p className="text-[10px] font-black text-muted-foreground/70 uppercase mb-1">Notes</p>
                  <p className="text-xs text-muted-foreground italic">"{options.instructions}"</p>
                </div>
              )}
            </SummarySection>
          </div>
        </div>
      </div>

      {/* Right Column: Pricing */}
      <div className="lg:col-span-4 sticky top-6">
        <Card className={`rounded-[2rem] overflow-hidden ${cardShell} relative border-primary/20`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <CardTitle className="text-xl font-black">Paiement</CardTitle>
            <CardDescription>Détail des frais et montant total.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {pricing.breakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-black">{item.amount.toFixed(2)} MAD</span>
                </div>
              ))}
              <div className="pt-4 border-t border-border/60 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-widest text-primary">Total Livraison</span>
                <span className="text-xl font-black text-primary">{pricing.total.toFixed(2)} MAD</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-background text-foreground shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Montant à Encaisser (COD)</p>
                  <DollarSign className="w-4 h-4 opacity-70" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    {(parseFloat(options.codAmount || '0') + pricing.total).toFixed(2)}
                  </span>
                  <span className="text-sm font-bold opacity-70">MAD</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border/60 space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-50 tracking-tighter">
                    <span>Marchandise</span>
                    <span>{parseFloat(options.codAmount || '0').toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-50 tracking-tighter">
                    <span>Frais Livraison</span>
                    <span>{pricing.total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                Le chauffeur collectera <span className="font-black">{(parseFloat(options.codAmount || '0')).toFixed(2)} MAD</span> (COD). 
                Les frais de livraison ({pricing.total.toFixed(2)} MAD) seront prélevés sur votre Wallet une fois la course livrée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepReview;

