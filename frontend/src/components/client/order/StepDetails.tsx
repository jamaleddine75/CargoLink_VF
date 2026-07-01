import React from 'react';
import { User, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGION_CITIES } from '@/lib/logistics-constants';

interface StepDetailsProps {
  formData: unknown;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

const cardShell =
  'border border-border/60 bg-background/50 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.10)]';

const StepDetails: React.FC<StepDetailsProps> = ({ formData, handleInputChange, handleSelectChange }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sender Card */}
      <Card className={`overflow-hidden relative group rounded-[2rem] ${cardShell}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-foreground">
            <User className="w-5 h-5 text-primary" />
            Informations Expéditeur
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            L’adresse de départ et le contact principal du client expéditeur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName" className="font-bold text-foreground">Nom complet *</Label>
            <Input
              id="senderName"
              name="senderName"
              placeholder="Ahmed Alaoui"
              className="bg-accent/20 border-border/60 h-12 rounded-2xl focus-visible:ring-primary/30"
              value={formData.senderName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderPhone" className="font-bold text-foreground">Téléphone *</Label>
            <Input
              id="senderPhone"
              name="senderPhone"
              placeholder="0612345678"
              className="bg-accent/20 border-border/60 h-12 rounded-2xl focus-visible:ring-primary/30"
              value={formData.senderPhone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderCity" className="font-bold text-foreground">Ville *</Label>
            <Select value={formData.senderCity} onValueChange={(v) => handleSelectChange('senderCity', v)}>
              <SelectTrigger className="bg-accent/20 border-border/60 h-12 rounded-2xl focus:ring-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {REGION_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receiver Card */}
      <Card className={`overflow-hidden relative group rounded-[2rem] ${cardShell}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-secondary/60" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-foreground">
            <Truck className="w-5 h-5 text-secondary" />
            Informations destinataire
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            La personne qui recevra la commande et sera contactée à la livraison.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiverName" className="font-bold text-foreground">Nom du destinataire *</Label>
            <Input
              id="receiverName"
              name="receiverName"
              placeholder="Sarah Mansouri"
              className="bg-accent/20 border-border/60 h-12 rounded-2xl focus-visible:ring-secondary/30"
              value={formData.receiverName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiverPhone" className="font-bold text-foreground">Téléphone destinataire *</Label>
            <Input
              id="receiverPhone"
              name="receiverPhone"
              placeholder="0687654321"
              className="bg-accent/20 border-border/60 h-12 rounded-2xl focus-visible:ring-secondary/30"
              value={formData.receiverPhone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiverCity" className="font-bold text-foreground">Ville destinataire *</Label>
            <Select value={formData.receiverCity} onValueChange={(v) => handleSelectChange('receiverCity', v)}>
              <SelectTrigger className="bg-accent/20 border-border/60 h-12 rounded-2xl focus:ring-secondary/30">
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {REGION_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepDetails;
