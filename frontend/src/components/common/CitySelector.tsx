import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SUPPORTED_CITIES } from '@/constants/supportedCities';

interface CitySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({ 
  value, 
  onValueChange, 
  className = "", 
  label = "City / Region",
  disabled = false,
  placeholder,
  triggerClassName
}) => {
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
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName || "h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10"}>
          <SelectValue placeholder={placeholder || "Select city"} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {SUPPORTED_CITIES.map(city => (
            <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelector;
