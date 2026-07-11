import React from "react";
import { MapPin, Navigation } from "lucide-react";
import { MoroccoMap } from "./LandingIllustrations";
import { SUPPORTED_CITIES } from "@/constants/supportedCities";

const CitiesSection = () => {
  return (
    <section id="cities" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Regional Network</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Supported Operational Cities
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CargoLink currently operates dedicated distribution hubs and courier fleets within the Tanger-Tetouan-Al Hoceima region.
          </p>
        </div>

        {/* Content Split */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: MoroccoMap SVG */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md bg-card border border-border p-4 rounded-lg shadow-sm">
              <MoroccoMap className="w-full" />
            </div>
          </div>

          {/* Right Column: Supported Cities List */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-xl font-bold text-foreground">Active Shipping Nodes</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We provide delivery and cash settlement services across the main highways connecting our active regional agencies. Shipments between any of these cities are processed within a single operational cycle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUPPORTED_CITIES.map((city, index) => (
                <div key={city.value} className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{city.label}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {city.value === "TANGER" ? "Central Hub" : "Regional Agency"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Navigation className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-normal">
                Looking to establish an agency in a new region? Contact our system administration to register your branch.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CitiesSection;
