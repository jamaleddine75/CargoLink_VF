import React from "react";
import { MapPin, Building, ShieldCheck, Clock } from "lucide-react";

const StatsSection = () => {
  return (
    <section id="stats" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Operational Status</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Real CargoLink Platform Parameters
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform is configured with concrete parameters to manage local logistics safely and predictably across the northern region.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-foreground">5 Cities</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Cities</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Fully mapping Tanger, Tetouan, Fnideq, Mdiq, and Chaouen.
            </p>
          </div>

          {/* Stat 2 */}
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Building className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-foreground">1 Central</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sorting Hub</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Tanger serves as the main freight sorting and dispatch center.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-foreground">100% Secure</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Escrow Settlement</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Cash on Delivery (COD) amounts are digitally tracked and reconciled.
            </p>
          </div>

          {/* Stat 4 */}
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-foreground">Same-Day</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inter-City SLA</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Transit routes are designed for same-day delivery across active nodes.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
