import React, { useMemo } from 'react';
import { Package, Ruler, AlertTriangle, ShieldAlert, Droplets, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { calculateVolumetricWeight } from '@/utils/pricing';

interface StepParcelProps {
  formData: unknown;
  updateNested: (path: string[], value: unknown) => void;
}

const cardShell = 'border border-border/60 bg-accent/20 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.10)]';

const StepParcel: React.FC<StepParcelProps> = ({ formData, updateNested }) => {
  const { parcel, attributes } = formData;
  
  const volumetricWeight = useMemo(() => {
    return calculateVolumetricWeight(parcel.dimensions);
  }, [parcel.dimensions]);

  const isVoluminous = volumetricWeight > (parseFloat(parcel.weight) || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Details */}
        <Card className={`rounded-[2rem] ${cardShell} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Package className="w-5 h-5 text-primary" />
              Nature du Colis
            </CardTitle>
            <CardDescription>Spécifiez le type et le poids réel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold">Type de colis *</Label>
              <Select value={parcel.type} onValueChange={(v) => updateNested(['parcel', 'type'], v)}>
                <SelectTrigger className="bg-background/50 border-border/60 h-12 rounded-xl">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parcel">Colis Standard</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Electronics">Électronique</SelectItem>
                  <SelectItem value="Clothes">Vêtements</SelectItem>
                  <SelectItem value="Other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold">Poids Réel (kg) *</Label>
              <Input
                type="number"
                value={parcel.weight}
                onChange={(e) => updateNested(['parcel', 'weight'], e.target.value)}
                placeholder="Ex: 2.5"
                className="bg-background/50 border-border/60 h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="font-bold">Type d'emballage</Label>
              <Select value={attributes.packagingType} onValueChange={(v) => updateNested(['attributes', 'packagingType'], v)}>
                <SelectTrigger className="bg-background/50 border-border/60 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carton">Carton</SelectItem>
                  <SelectItem value="Sac">Sac</SelectItem>
                  <SelectItem value="Palette">Palette</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className={`rounded-[2rem] ${cardShell} relative overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Ruler className="w-5 h-5 text-cyan-500" />
              Dimensions (cm)
            </CardTitle>
            <CardDescription>Pour le calcul du poids volumétrique.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase opacity-60 text-center block">Long.</Label>
                <Input
                  type="number"
                  value={parcel.dimensions.length}
                  onChange={(e) => updateNested(['parcel', 'dimensions', 'length'], e.target.value)}
                  placeholder="L"
                  className="bg-background/50 border-border/60 h-12 rounded-xl text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase opacity-60 text-center block">Larg.</Label>
                <Input
                  type="number"
                  value={parcel.dimensions.width}
                  onChange={(e) => updateNested(['parcel', 'dimensions', 'width'], e.target.value)}
                  placeholder="W"
                  className="bg-background/50 border-border/60 h-12 rounded-xl text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase opacity-60 text-center block">Haut.</Label>
                <Input
                  type="number"
                  value={parcel.dimensions.height}
                  onChange={(e) => updateNested(['parcel', 'dimensions', 'height'], e.target.value)}
                  placeholder="H"
                  className="bg-background/50 border-border/60 h-12 rounded-xl text-center"
                />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Poids Volumétrique</p>
                <p className="text-2xl font-black text-foreground">{volumetricWeight} <span className="text-sm font-bold opacity-50">kg</span></p>
              </div>
              {isVoluminous && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 py-1 px-3 rounded-full animate-pulse">
                  <Zap className="w-3 h-3 mr-1" /> Colis Volumineux
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground italic text-center">* Le poids final retenu sera le plus élevé des deux.</p>
          </CardContent>
        </Card>
      </div>

      {/* Attributes */}
      <Card className={`rounded-[2rem] ${cardShell} relative overflow-hidden`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-background/50 border border-border/60 hover:border-amber-500/30 transition-colors">
              <Checkbox 
                id="fragile" 
                checked={attributes.fragile}
                onCheckedChange={(checked) => updateNested(['attributes', 'fragile'], checked)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="fragile" className="text-sm font-bold leading-none flex items-center gap-2 cursor-pointer">
                  Fragile <ShieldAlert className="w-3 h-3 text-amber-500" />
                </label>
                <p className="text-[10px] text-muted-foreground italic">+15 MAD de frais</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-background/50 border border-border/60 hover:border-primary/30 transition-colors">
              <Checkbox 
                id="liquid" 
                checked={attributes.liquid}
                onCheckedChange={(checked) => updateNested(['attributes', 'liquid'], checked)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="liquid" className="text-sm font-bold leading-none flex items-center gap-2 cursor-pointer">
                  Liquide <Droplets className="w-3 h-3 text-primary" />
                </label>
                <p className="text-[10px] text-muted-foreground">Contenu liquide</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-background/50 border border-border/60 hover:border-red-500/30 transition-colors">
              <Checkbox 
                id="dangerous" 
                checked={attributes.dangerous}
                onCheckedChange={(checked) => updateNested(['attributes', 'dangerous'], checked)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="dangerous" className="text-sm font-bold leading-none flex items-center gap-2 cursor-pointer">
                  Produit dangereux <AlertTriangle className="w-3 h-3 text-red-500" />
                </label>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Sujet à vérification</p>
              </div>
            </div>
          </div>
          
          {attributes.dangerous && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Attention: Les produits dangereux nécessitent une manipulation spéciale et peuvent être refusés par certains transporteurs.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StepParcel;
