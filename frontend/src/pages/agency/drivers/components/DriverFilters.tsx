import React from 'react';
import { Search, Filter, X, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-4 relative z-10">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Search by name, plate, or phone..."
          className="w-full h-16 pl-16 pr-12 rounded-[1.5rem] bg-accent/20 border border-border/40 backdrop-blur-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm transition-all text-primary-foreground placeholder:text-muted-foreground/40 uppercase tracking-tight"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Rows */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Permit filter */}
        <div className="flex items-center gap-2 bg-accent/10 p-1.5 rounded-[1.5rem] border border-border/40 backdrop-blur-xl flex-1 lg:flex-none">
          <div className="flex items-center px-4 border-r border-border/40 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground/60 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Permit</span>
          </div>
          <div className="flex gap-1">
            {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant="ghost"
                className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-primary-foreground shadow-lg shadow-blue-600/20'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-accent/30'
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Availability filter */}
        <div className="flex items-center gap-2 bg-accent/10 p-1.5 rounded-[1.5rem] border border-border/40 backdrop-blur-xl flex-1 lg:flex-none">
          <div className="flex items-center px-4 border-r border-border/40 shrink-0">
            <Activity className="w-4 h-4 text-muted-foreground/60 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Status</span>
          </div>
          <div className="flex gap-1">
            {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setAvailabilityFilter(status)}
                variant="ghost"
                className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  availabilityFilter === status
                    ? 'bg-emerald-600 text-primary-foreground shadow-lg shadow-emerald-600/20'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-accent/30'
                }`}
              >
                {status === 'ONLINE' ? 'Live' : status === 'OFFLINE' ? 'Idle' : 'All'}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
