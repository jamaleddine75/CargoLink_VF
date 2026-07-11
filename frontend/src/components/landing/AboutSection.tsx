import React from "react";
import { Building2, Truck, Users } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">About CargoLink</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Northern Morocco's Connected Logistics Network
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CargoLink bridges the gap between regional merchants, courier partners, and local transit points, establishing a reliable shipping grid across the northern provinces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Regional Agencies */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">1. Logistics Agencies</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Local transport centers serving as sorting hubs. Agencies manage courier assignments, consolidate packages, coordinate regional shipments, and settle driver wallets.
            </p>
          </div>

          {/* Card 2: Driver Partners */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">2. Vetted Couriers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Professional delivery operators. Couriers register with validated documents, track assigned routes via GPS, collect cash-on-delivery payments, and verify hand-offs using digital QR scans.
            </p>
          </div>

          {/* Card 3: Merchants & Clients */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">3. Local Clients</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Merchants and consumers shipping goods. Clients create orders instantly, select sender and receiver cities, trace delivery progress via live timelines, and manage shipping addresses.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
