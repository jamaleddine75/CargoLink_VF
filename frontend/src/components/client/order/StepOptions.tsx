import React from 'react';
import { DollarSign, ShieldCheck, Clock, MessageSquare, Truck, Zap, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

interface StepOptionsProps {
  formData: any;
  updateNested: (path: string[], value: any) => void;
}

const cardShell = 'border border-border/60 bg-accent/20 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.10)]';

const StepOptions: React.FC<StepOptionsProps> = ({ formData, updateNested }) => {
  const { options } = formData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment & COD */}
        <Card className={`rounded-[2rem] ${cardShell} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-green-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <DollarSign className="w-5 h-5 text-secondary" />
              Paiement & COD
            </CardTitle>
            <CardDescription>Montant à collecter à la livraison.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="font-bold flex items-center gap-2">
                Montant à encaisser (COD) *
                <Badge variant="outline" className="text-[10px] uppercase bg-secondary/10 text-secondary border-secondary/20">MAD</Badge>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/50">DH</span>
                <Input
                  type="number"
                  value={options.codAmount}
                  onChange={(e) => updateNested(['options', 'codAmount'], e.target.value)}
                  placeholder="0.00"
                  className="pl-14 bg-background/50 border-border/60 h-16 text-3xl font-black rounded-2xl focus:ring-secondary/30"
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> Ce montant sera collecté par le livreur et reversé sur votre compte.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-background text-foreground shadow-xl transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="insurance-toggle" className="font-black text-xs uppercase tracking-widest cursor-pointer opacity-80">Activer Assurance</Label>
                <Switch 
                  id="insurance-toggle"
                  checked={options.insurance.enabled}
                  onCheckedChange={(checked) => updateNested(['options', 'insurance', 'enabled'], checked)}
                />
              </div>
              {options.insurance.enabled && (
                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase opacity-70">Valeur déclarée de la marchandise</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <Input
                      type="number"
                      value={options.insurance.declaredValue}
                      onChange={(e) => updateNested(['options', 'insurance', 'declaredValue'], e.target.value)}
                      placeholder="Ex: 1500"
                      className="pl-10 h-10 bg-accent/10 border-border/60 rounded-xl font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card className={`rounded-[2rem] ${cardShell} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Truck className="w-5 h-5 text-primary" />
              Options de Livraison
            </CardTitle>
            <CardDescription>Vitesse et instructions spéciales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={options.deliveryOption} 
              onValueChange={(v) => updateNested(['options', 'deliveryOption'], v)}
              className="grid grid-cols-1 gap-3"
            >
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${options.deliveryOption === 'standard' ? 'bg-primary/10 border-primary/30' : 'bg-background/50 border-border/60'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Standard</p>
                    <p className="text-[10px] opacity-60">24-48 Heures</p>
                  </div>
                </div>
                <RadioGroupItem value="standard" id="standard" />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${options.deliveryOption === 'express' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-background/50 border-border/60'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Express</p>
                    <p className="text-[10px] opacity-60">Avant 12h (+25 MAD)</p>
                  </div>
                </div>
                <RadioGroupItem value="express" id="express" />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${options.deliveryOption === 'same_day' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-background/50 border-border/60'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Same Day</p>
                    <p className="text-[10px] opacity-60">Livraison le jour même (+40 MAD)</p>
                  </div>
                </div>
                <RadioGroupItem value="same_day" id="same_day" />
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" /> Instructions (Optionnel)
              </Label>
              <Textarea
                value={options.instructions}
                onChange={(e) => updateNested(['options', 'instructions'], e.target.value)}
                placeholder="Ex: Appeler avant d'arriver, Fragile, etc..."
                className="bg-background/50 border-border/60 min-h-[80px] rounded-xl text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepOptions;
