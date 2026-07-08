import React from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  placeholder?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  search,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  placeholder = 'Rechercher...',
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8 h-9 text-xs"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(f)}
            className={cn(
              'h-7 text-[11px] font-semibold px-2.5 rounded-md',
              activeFilter === f && 'shadow-sm'
            )}
          >
            {f === 'ALL' ? 'Tous' : f.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SearchFilters;
