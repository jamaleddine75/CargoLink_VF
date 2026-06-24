import React from 'react';
import { MapPin, Book, LocateFixed, User, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CargoMap from '@/components/common/CargoMap';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';
import AddressBook from '@/components/client/AddressBook';
import { REGION_CITIES, getCityCoordinates } from '@/lib/logistics-constants';
import { SavedAddress } from '@/services/api/addressService';

interface StepLocationProps {
  formData: any;
  updateNested: (path: string[], value: any) => void;
  handleAddressSelect: (type: 'sender' | 'receiver', addr: SavedAddress) => Promise<void>;
  handleMapClick: (type: 'sender' | 'receiver', lat: number, lng: number) => void;
  handleLocateMe: (type: 'sender' | 'receiver') => void;
  locating: boolean;
}

const cardShell =
  'border border-border/60 bg-background/50 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.10)]';

const StepLocation: React.FC<StepLocationProps> = ({
  formData,
  updateNested,
  handleAddressSelect,
  handleMapClick,
  handleLocateMe,
  locating
}) => {
  const [senderOpen, setSenderOpen] = React.useState(false);
  const [receiverOpen, setReceiverOpen] = React.useState(false);

  const senderMapCenter = React.useMemo(() => {
    const s = formData.locations.sender;
    return s.lat && s.lng
      ? [s.lat, s.lng] as [number, number]
      : getCityCoordinates(s.city);
  }, [formData.locations.sender.lat, formData.locations.sender.lng, formData.locations.sender.city]);

  const receiverMapCenter = React.useMemo(() => {
    const r = formData.locations.receiver;
    return r.lat && r.lng
      ? [r.lat, r.lng] as [number, number]
      : getCityCoordinates(r.city);
  }, [formData.locations.receiver.lat, formData.locations.receiver.lng, formData.locations.receiver.city]);

  // Handle manual city selection
  const handleCityChange = (type: 'sender' | 'receiver', city: string) => {
    const currentCity = formData.locations[type].city;
    if (city !== currentCity) {
      updateNested(['locations', type, 'city'], city);
      // Reset address and coords ONLY if city actually changed manually
      updateNested(['locations', type, 'address'], '');
      updateNested(['locations', type, 'lat'], null);
      updateNested(['locations', type, 'lng'], null);
      updateNested(['locations', type, 'savedAddressId'], null);
    }
  };

  const onSelectFromBook = async (type: 'sender' | 'receiver', addr: SavedAddress) => {
    try {
      await handleAddressSelect(type, addr);
      if (type === 'sender') setSenderOpen(false);
      else setReceiverOpen(false);
    } catch (err) {
      console.error('Error selecting address:', err);
    }
  };

  const renderContactFields = (type: 'sender' | 'receiver') => {
    const isSender = type === 'sender';
    const data = formData.locations[type];
    const iconColor = isSender ? 'text-primary/50' : 'text-secondary/50';
    const focusRing = isSender ? 'focus:ring-primary/30' : 'focus:ring-secondary/30';

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label className="font-bold text-foreground">Nom Complet *</Label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
            <Input
              value={data.name || ''}
              onChange={(e) => updateNested(['locations', type, 'name'], e.target.value)}
              placeholder={isSender ? "Votre nom" : "Nom du destinataire"}
              className={`pl-10 bg-accent/20 border-border/60 h-11 rounded-xl ${focusRing}`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-foreground">Téléphone *</Label>
          <div className="relative">
            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
            <Input
              value={data.phone || ''}
              onChange={(e) => updateNested(['locations', type, 'phone'], e.target.value)}
              placeholder="06XXXXXXXX"
              className={`pl-10 bg-accent/20 border-border/60 h-11 rounded-xl ${focusRing}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pickup Location */}
      <Card className={`overflow-hidden relative group rounded-[2rem] ${cardShell}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl font-black text-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Expéditeur & Ramassage
            </div>
            <Dialog open={senderOpen} onOpenChange={setSenderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest border-border/60 bg-accent/20">
                  <Book className="w-3 h-3 mr-2 text-primary" /> Carnet
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border/60 text-foreground rounded-[2rem] max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Choisir une adresse de <span className="text-primary">Ramassage</span></DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">
                    Sélectionnez une adresse enregistrée pour accélérer la création de votre envoi.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                  <AddressBook 
                    selectable 
                    onSelect={(addr) => onSelectFromBook('sender', addr)} 
                    selectedId={formData.locations.sender.savedAddressId}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription className="text-muted-foreground">Qui envoie le colis et d'où ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContactFields('sender')}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Ville *</Label>
              <Select
                value={formData.locations.sender.city || ''}
                onValueChange={(v) => handleCityChange('sender', v)}
              >
                <SelectTrigger className="bg-accent/20 border-border/60 h-11 rounded-xl focus:ring-primary/30">
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {REGION_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Adresse Exacte *</Label>
              <div className="flex gap-2">
                <AddressAutocomplete
                  value={formData.locations.sender.address || ''}
                  cityContext={formData.locations.sender.city}
                  onChange={(v) => updateNested(['locations', 'sender', 'address'], v)}
                  onSelectAddress={(addr) => {
                    updateNested(['locations', 'sender', 'address'], addr.address);
                    updateNested(['locations', 'sender', 'lat'], addr.lat);
                    updateNested(['locations', 'sender', 'lng'], addr.lng);
                  }}
                  placeholder="Rue, Quartier..."
                  className="flex-1 bg-accent/20 border-border/60 h-11 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0 border-border/60"
                  onClick={() => handleLocateMe('sender')}
                  disabled={locating}
                >
                  <LocateFixed className={`w-5 h-5 ${locating ? 'animate-pulse text-primary' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
          <div className="h-[200px] rounded-2xl overflow-hidden border border-border/60 shadow-inner">
            <CargoMap
              center={senderMapCenter}
              zoom={15}
              points={formData.locations.sender.lat && formData.locations.sender.lng ? [{
                id: 'sender',
                lat: formData.locations.sender.lat,
                lng: formData.locations.sender.lng,
                type: 'PICKUP',
                label: 'Ramassage'
              }] : []}
              onLocationSelect={(lat, lng) => handleMapClick('sender', lat, lng)}
              mode="PICKER"
              interactive={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Location */}
      <Card className={`overflow-hidden relative group rounded-[2rem] ${cardShell}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-secondary/60" />
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl font-black text-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              Destinataire & Livraison
            </div>
            <Dialog open={receiverOpen} onOpenChange={setReceiverOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase font-black tracking-widest border-border/60 bg-accent/20">
                  <Book className="w-3 h-3 mr-2 text-secondary" /> Carnet
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border/60 text-foreground rounded-[2rem] max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Choisir une adresse de <span className="text-secondary">Livraison</span></DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">
                    Sélectionnez un destinataire habituel pour éviter les erreurs de saisie.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                  <AddressBook 
                    selectable 
                    onSelect={(addr) => onSelectFromBook('receiver', addr)} 
                    selectedId={formData.locations.receiver.savedAddressId}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription className="text-muted-foreground">À qui le colis doit être livré ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContactFields('receiver')}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Ville *</Label>
              <Select
                value={formData.locations.receiver.city || ''}
                onValueChange={(v) => handleCityChange('receiver', v)}
              >
                <SelectTrigger className="bg-accent/20 border-border/60 h-11 rounded-xl focus:ring-secondary/30">
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {REGION_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Adresse Exacte *</Label>
              <div className="flex gap-2">
                <AddressAutocomplete
                  value={formData.locations.receiver.address || ''}
                  cityContext={formData.locations.receiver.city}
                  onChange={(v) => updateNested(['locations', 'receiver', 'address'], v)}
                  onSelectAddress={(addr) => {
                    updateNested(['locations', 'receiver', 'address'], addr.address);
                    updateNested(['locations', 'receiver', 'lat'], addr.lat);
                    updateNested(['locations', 'receiver', 'lng'], addr.lng);
                  }}
                  placeholder="Rue, Quartier..."
                  className="flex-1 bg-accent/20 border-border/60 h-11 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0 border-border/60"
                  onClick={() => handleLocateMe('receiver')}
                  disabled={locating}
                >
                  <LocateFixed className={`w-5 h-5 ${locating ? 'animate-pulse text-secondary' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
          <div className="h-[200px] rounded-2xl overflow-hidden border border-border/60 shadow-inner">
            <CargoMap
              center={receiverMapCenter}
              zoom={15}
              points={formData.locations.receiver.lat && formData.locations.receiver.lng ? [{
                id: 'receiver',
                lat: formData.locations.receiver.lat,
                lng: formData.locations.receiver.lng,
                type: 'DELIVERY',
                label: 'Livraison'
              }] : []}
              onLocationSelect={(lat, lng) => handleMapClick('receiver', lat, lng)}
              mode="PICKER"
              interactive={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepLocation;
