import React from 'react';
import { Search, Filter, X, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DriverFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: 'ALL' | 'ACTIVE' | 'EXPIRED';
  setFilterStatus: (status: 'ALL' | 'ACTIVE' | 'EXPIRED') => void;
  availabilityFilter: 'ALL' | 'ONLINE' | 'OFFLINE';
  setAvailabilityFilter: (status: 'ALL' | 'ONLINE' | 'OFFLINE') => void;
}

export const DriverFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  availabilityFilter,
  setAvailabilityFilter,
}: DriverFiltersProps) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par nom, plaque ou téléphone..."
          className="pl-9 h-10 bg-card border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Rows */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Permit filter */}
        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
          <div className="flex items-center px-2 border-r border-border shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Permis</span>
          </div>
          <div className="flex gap-0.5">
            {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md text-[10px] font-semibold uppercase transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {status === 'ALL' ? 'Tous' : status === 'ACTIVE' ? 'Actif' : 'Expiré'}
              </Button>
            ))}
          </div>
        </div>

        {/* Availability filter */}
        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
          <div className="flex items-center px-2 border-r border-border shrink-0">
            <Activity className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Statut</span>
          </div>
          <div className="flex gap-0.5">
            {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setAvailabilityFilter(status)}
                variant="ghost"
                size="sm"
                className={`h-8 px-3 rounded-md text-[10px] font-semibold uppercase transition-all ${
                  availabilityFilter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {status === 'ONLINE' ? 'En ligne' : status === 'OFFLINE' ? 'Hors ligne' : 'Tous'}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
