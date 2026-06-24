/**
 * Address Autocomplete Component
 * Provides suggestions as user types address
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressOption {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (address: AddressOption) => void;
  cityContext?: string; // Optional city to filter suggestions
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

// Mock address database for the Northern Morocco delivery zone
const MOROCCAN_ADDRESSES: Record<string, AddressOption[]> = {
  'Tanger': [
    { address: 'Avenue des FAR', city: 'Tanger', lat: 35.7595, lng: -5.8340 },
    { address: 'Boulevard Pasteur', city: 'Tanger', lat: 35.7825, lng: -5.8115 },
    { address: 'Ibn Batouta Mall', city: 'Tanger', lat: 35.7651, lng: -5.8011 },
    { address: 'Port Tanger Med', city: 'Tanger', lat: 35.8827, lng: -5.5126 },
    { address: 'Quartier Marshan', city: 'Tanger', lat: 35.7915, lng: -5.8214 },
    { address: 'Place des Nations', city: 'Tanger', lat: 35.7728, lng: -5.8055 },
  ],
  'Tetouan': [
    { address: 'Avenue Hassan II', city: 'Tetouan', lat: 35.5785, lng: -5.3684 },
    { address: 'Place Moulay El Mehdi', city: 'Tetouan', lat: 35.5721, lng: -5.3725 },
    { address: 'Quartier Wilaya', city: 'Tetouan', lat: 35.5841, lng: -5.3512 },
    { address: 'Martil Corniche', city: 'Martil', lat: 35.6164, lng: -5.2690 },
  ],
  'Fnideq': [
    { address: 'Avenue Mohammed V', city: 'Fnideq', lat: 35.8480, lng: -5.3508 },
    { address: 'Centre Ville', city: 'Fnideq', lat: 35.8504, lng: -5.3435 },
    { address: 'Bab Sebta', city: 'Fnideq', lat: 35.8541, lng: -5.3382 },
  ],
  'Mdiq': [
    { address: 'Corniche Mdiq', city: 'Mdiq', lat: 35.6858, lng: -5.3267 },
    { address: 'Avenue Hassan II', city: 'Mdiq', lat: 35.6869, lng: -5.3314 },
    { address: 'Port Mdiq', city: 'Mdiq', lat: 35.6839, lng: -5.3210 },
  ],
  'Martil': [
    { address: 'Avenue Hassan II', city: 'Martil', lat: 35.6161, lng: -5.2750 },
    { address: 'Corniche Martil', city: 'Martil', lat: 35.6170, lng: -5.2686 },
    { address: 'Université Abdelmalek Essaâdi', city: 'Martil', lat: 35.6118, lng: -5.2737 },
  ],
};

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(({
  value,
  onChange,
  onSelectAddress,
  cityContext,
  placeholder = 'Enter address...',
  className = '',
  id,
  name
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressOption[]>([]);
  const internalRef = useRef<HTMLInputElement>(null);

  // Expose internal input ref
  useImperativeHandle(ref, () => internalRef.current!);

  // Generate suggestions based on input
  useEffect(() => {
    if (!(value || "").trim() || (value || "").length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      // 1. Search through mock addresses (Instant)
      const query = value.toLowerCase();
      const mockResults: AddressOption[] = [];

      Object.values(MOROCCAN_ADDRESSES).forEach(cityAddresses => {
        cityAddresses.forEach(addr => {
          // If cityContext is provided, prioritize results from that city
          const cityMatches = cityContext ? addr.city.toLowerCase() === cityContext.toLowerCase() : true;
          
          if (
            (addr.address.toLowerCase().includes(query) || addr.city.toLowerCase().includes(query)) &&
            cityMatches
          ) {
            mockResults.push(addr);
          }
        });
      });

      // 2. Search through Nominatim API (Global)
      try {
        const url = cityContext 
          ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', ' + cityContext)}&countrycodes=ma&limit=5`
          : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=ma&limit=5`;
          
        const res = await fetch(url);
        const data = await res.json();
        
        const apiResults: AddressOption[] = data.map((item: any) => ({
          address: item.display_name?.split(',')[0] || '',
          city: item.display_name?.split(',').find((s: string) => s.trim().length > 3) || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));

        // Filter API results by city if context exists
        const filteredApi = cityContext 
          ? apiResults.filter(r => r.city.toLowerCase().includes(cityContext.toLowerCase()) || cityContext.toLowerCase().includes(r.city.toLowerCase()))
          : apiResults;

        // Combine and deduplicate
        const combined = [...mockResults, ...filteredApi].filter(
          (v, i, a) => a.findIndex(t => t.lat === v.lat && t.lng === v.lng) === i
        );

        setSuggestions(combined.slice(0, 6));
        setIsOpen(combined.length > 0);
      } catch (err) {
        console.error('Geocoding error:', err);
        setSuggestions(mockResults);
        setIsOpen(mockResults.length > 0);
      }
    };

    const timer = setTimeout(fetchSuggestions, 400); // Debounce
    return () => clearTimeout(timer);
  }, [value, cityContext]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = internalRef.current?.closest('.relative');
      if (container && !container.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (address: AddressOption) => {
    onChange(`${address.address}, ${address.city}`);
    onSelectAddress?.(address);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={internalRef}
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-background/50 border-white/5 h-12 rounded-xl pr-10 ${className}`}
        autoComplete="off"
        onFocus={() => (value || "").trim() && suggestions.length > 0 && setIsOpen(true)}
      />

      {/* Dropdown Icon */}
      {suggestions.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <ul className="divide-y divide-border/50 max-h-[250px] overflow-y-auto">
              {suggestions.map((address, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(address)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex flex-col gap-1 group"
                  >
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">
                      {address.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {address.city} • 📍 {address.lat.toFixed(4)}, {address.lng.toFixed(4)}
                    </p>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
