import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: string[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  placeholder?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  search,
  onSearchChange,
  filters = [],
  activeFilter,
  onFilterChange,
  placeholder = "Search data node...",
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-accent/10 backdrop-blur-3xl border border-border/40 p-4 rounded-3xl">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
        <Input
          placeholder={placeholder}
          className="pl-12 bg-accent/30 border-border/40 rounded-2xl h-12 text-xs focus:ring-blue-500/50"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-muted-foreground/40 ml-2 hidden md:block" />
          {filters.map((filter) => (
            <Badge
              key={filter}
              onClick={() => onFilterChange?.(filter)}
              className={`cursor-pointer px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                activeFilter === filter
                  ? "bg-blue-600 text-primary-foreground shadow-lg shadow-blue-600/20"
                  : "bg-accent/30 text-muted-foreground/60 hover:bg-accent/40 border border-border/40"
              }`}
            >
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
