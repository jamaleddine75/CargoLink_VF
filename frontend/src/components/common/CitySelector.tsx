import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getAvailableCities } from '@/services/api/publicService';

interface CitySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({ 
  value, 
  onValueChange, 
  className = "", 
  label = "City / Region",
  disabled = false
}) => {
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const data = await getAvailableCities();
        setCities(data);
      } catch (error) {
        console.error('Failed to fetch operational cities:', error);
        toast.error('Could not load cities. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCities();
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          {label}
        </Label>
      )}
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10">
          <SelectValue placeholder={isLoading ? "Loading cities..." : "Select city"} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {cities.length > 0 ? (
            cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>No operational cities found</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelector;
