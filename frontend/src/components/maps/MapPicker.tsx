import React from 'react';
import CargoMap, { MapPoint } from '@/components/common/CargoMap';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapPickerProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

const MapPicker: React.FC<MapPickerProps> = ({
  center = [35.7595, -5.8340],
  zoom = 13,
  onLocationSelect,
  selectedLocation,
  className = "h-[300px] w-full rounded-2xl overflow-hidden"
}) => {
  const points: MapPoint[] = selectedLocation ? [{
    id: 'picked-location',
    lat: selectedLocation.lat,
    lng: selectedLocation.lng,
    type: 'DELIVERY',
    label: 'Emplacement sélectionné'
  }] : [];

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className={`relative ${className} border border-border/40 shadow-inner group overflow-hidden rounded-2xl`}>
      <CargoMap
        points={points}
        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : center}
        zoom={zoom}
        onLocationSelect={onLocationSelect}
        mode="PICKER"
        height="100%"
      />

      {/* Map Overlays */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleLocateMe}
          className="bg-background/80 backdrop-blur-md border border-border/40 hover:bg-background shadow-lg rounded-xl"
          title="Ma position"
        >
          <LocateFixed className="w-5 h-5 text-blue-500" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-background/80 backdrop-blur-md border border-border/40 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {selectedLocation 
              ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` 
              : "Cliquez pour choisir"}
          </span>
        </div>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 rounded-br-2xl pointer-events-none" />
    </div>
  );
};

export default MapPicker;
