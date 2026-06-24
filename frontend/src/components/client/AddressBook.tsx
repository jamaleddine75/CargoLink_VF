import React, { useState, useEffect } from 'react';
import { 
  MapPin, Home, Briefcase, Plus, Trash2, Edit2, 
  Search, Check, Navigation, Phone, User as UserIcon,
  X, Map as MapIcon, Loader2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import addressService, { SavedAddress, SavedAddressRequest } from '@/services/api/addressService';
import CargoMap from '@/components/common/CargoMap';
import { REGION_CITIES, getCityCoordinates } from '@/lib/logistics-constants';

interface AddressBookProps {
  onSelect?: (address: SavedAddress) => void;
  selectable?: boolean;
  selectedId?: string;
}

export default function AddressBook({ onSelect, selectable = false, selectedId }: AddressBookProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formData, setFormData] = useState<SavedAddressRequest>({
    label: '',
    address: '',
    city: '',
    contactName: '',
    contactPhone: '',
    lat: undefined,
    lng: undefined
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getSavedAddresses();
      setAddresses(data);
    } catch (error) {
      toast.error('Failed to load address book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleMapClick = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        // Extract a clean address from the display_name
        const parts = data.display_name.split(', ');
        const cleanAddress = parts.slice(0, 3).join(', ');
        setFormData(prev => ({ ...prev, address: cleanAddress }));
      }
    } catch (err) {
      console.warn('Reverse geocoding failed', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCityChange = (city: string) => {
    const coords = getCityCoordinates(city);
    setFormData(prev => ({ 
      ...prev, 
      city, 
      lat: coords[0], 
      lng: coords[1],
      address: '' // Clear address when city changes to encourage map selection
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGeocoding(true);
      let lat = formData.lat;
      let lng = formData.lng;

      // Final fallback if user didn't use map but typed address
      if (!lat || !lng) {
        try {
          const query = `${formData.address}, ${formData.city}, Morocco`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          if (data && data[0]) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (geoError) {
          console.warn('Geocoding failed, saving without coordinates', geoError);
        }
      }

      const finalData = { ...formData, lat, lng };

      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, finalData);
        toast.success('Address updated successfully');
      } else {
        await addressService.saveAddress(finalData);
        toast.success('Address saved to book');
      }
      setIsModalOpen(false);
      setEditingAddress(null);
      setFormData({ label: '', address: '', city: '', contactName: '', contactPhone: '', lat: undefined, lng: undefined });
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to save address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressService.deleteAddress(id);
      toast.success('Address removed');
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const openEdit = (address: SavedAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      contactName: address.contactName || '',
      contactPhone: address.contactPhone || '',
      lat: address.lat,
      lng: address.lng
    });
    setIsModalOpen(true);
  };

  const filteredAddresses = addresses.filter(a => 
    a.label.toLowerCase().includes(search.toLowerCase()) || 
    a.address.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home') || l.includes('maison')) return Home;
    if (l.includes('work') || l.includes('office') || l.includes('bureau') || l.includes('travail')) return Briefcase;
    return MapPin;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher une adresse..."
            className="pl-12 bg-card/40 border-border/50 rounded-2xl h-12 text-sm backdrop-blur-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingAddress(null);
            setFormData({ label: '', address: '', city: '', contactName: '', contactPhone: '', lat: undefined, lng: undefined });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary hover:bg-primary/80 h-12 px-6 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border/60 text-foreground rounded-[2rem] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {editingAddress ? 'Update' : 'Save'} <span className="text-primary">Address</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/60 text-xs font-medium">
                {editingAddress 
                  ? "Modify your saved location details below." 
                  : "Add a new frequently used address to your book for faster shipping."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Label</label>
                      <Input 
                        placeholder="Home, Work, etc." 
                        required
                        value={formData.label}
                        onChange={(e) => setFormData({...formData, label: e.target.value})}
                        className="bg-accent/20 border-border/60 h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">City</label>
                      <Select value={formData.city} onValueChange={(v) => handleCityChange(v)}>
                        <SelectTrigger className="bg-accent/20 border-border/60 h-12 rounded-xl">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border/60 text-foreground">
                          {REGION_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Address</label>
                      {isGeocoding && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>
                    <Input
                      placeholder="Street name, building, apartment..."
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="bg-accent/20 border-border/60 h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Contact Name (Opt)</label>
                      <Input 
                        placeholder="John Doe" 
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                        className="bg-accent/20 border-border/60 h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Contact Phone (Opt)</label>
                      <Input 
                        placeholder="06..." 
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                        className="bg-accent/20 border-border/60 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-2">
                    <MapIcon className="w-3 h-3" /> Pin Location
                  </label>
                  <div className="h-[300px] md:h-full min-h-[300px] rounded-[1.5rem] overflow-hidden border border-border/60 bg-accent/5">
                    <CargoMap
                      mode="PICKER"
                      center={formData.lat && formData.lng ? [formData.lat, formData.lng] : (formData.city ? getCityCoordinates(formData.city) : undefined)}
                      zoom={formData.lat && formData.lng ? 16 : 13}
                      points={formData.lat && formData.lng ? [{
                        id: 'current-selection',
                        lat: formData.lat,
                        lng: formData.lng,
                        type: 'PICKUP',
                        label: 'Selected Location'
                      }] : []}
                      onLocationSelect={handleMapClick}
                      interactive={true}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGeocoding}
                className="w-full h-14 bg-primary hover:bg-primary/80 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {isGeocoding ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Location...
                  </>
                ) : (
                  editingAddress ? 'Update Saved Address' : 'Save to Address Book'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-3xl bg-accent/20 animate-pulse" />
          ))}
        </div>
      ) : filteredAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAddresses.map((addr, idx) => {
              const Icon = getIcon(addr.label);
              return (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card
                    onClick={() => selectable && onSelect?.(addr)}
                    className={cn(
                      "group bg-card/40 backdrop-blur-3xl border rounded-[2rem] hover:bg-card/60 hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden h-full relative shadow-xl",
                      selectable && "active:scale-[0.98]",
                      selectedId === addr.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50"
                    )}
                  >
                    {selectedId === addr.id && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                            <Icon className="w-5 h-5 text-primary/70" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs uppercase tracking-tight text-foreground/90">{addr.label}</h4>
                            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-0.5">{addr.city}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => openEdit(addr, e)}
                            className="w-8 h-8 rounded-lg hover:bg-accent/20 text-muted-foreground/60 hover:text-foreground"
                           >
                              <Edit2 className="w-3.5 h-3.5" />
                           </Button>
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(addr.id, e)}
                            className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive"
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground/70 line-clamp-2 min-h-[2rem]">
                          {addr.address}
                        </p>

                        {(addr.contactName || addr.contactPhone) && (
                          <div className="pt-3 border-t border-border/60 flex flex-wrap gap-3">
                             {addr.contactName && (
                               <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/50">
                                  <UserIcon className="w-3 h-3" /> {addr.contactName}
                               </div>
                             )}
                             {addr.contactPhone && (
                               <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/50">
                                  <Phone className="w-3 h-3" /> {addr.contactPhone}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    {selectable && (
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-3xl transition-colors pointer-events-none" />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-accent/5 rounded-[2.5rem] border-2 border-dashed border-border/60">
           <MapPin className="w-12 h-12 text-muted-foreground/20 mb-4" />
           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">No saved addresses found</p>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
