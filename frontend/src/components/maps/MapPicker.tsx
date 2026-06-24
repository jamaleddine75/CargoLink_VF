import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Component to handle map clicks
const LocationMarker = ({ 
  onLocationSelect, 
  selectedLocation 
}: { 
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
    </Marker>
  ) : null;
};

// Component to fly to a location
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({
  center = [35.7595, -5.8340], // Default to Tangier
  zoom = 13,
  onLocationSelect,
  selectedLocation,
  className = "h-[300px] w-full rounded-2xl overflow-hidden"
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect(latitude, longitude);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className={`relative ${className} border border-border/40 shadow-inner group`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme tiles
        />
        <LocationMarker onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />
        {selectedLocation && <RecenterMap lat={selectedLocation.lat} lng={selectedLocation.lng} />}
      </MapContainer>

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
