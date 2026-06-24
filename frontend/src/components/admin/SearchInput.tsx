import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  onSearch, 
  placeholder = "Search admins...", 
  className 
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-full pl-11 pr-11 bg-muted/20 border-border/40 rounded-xl font-bold text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 placeholder:font-medium"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-focus-within:w-1/2 transition-all duration-500 rounded-full opacity-50" />
    </div>
  );
};

export default SearchInput;
