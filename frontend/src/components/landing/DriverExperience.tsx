import React from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, MapPin, Scan, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const DriverExperience = () => {
  return (
    <section id="driver-experience" className="py-20 bg-muted/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text Copy */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-bold text-primary uppercase tracking-widest">
              Courier Partner Experience
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
              On-the-Road Control and Direct Settlements
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Designed for regional couriers. Vetted driver partners manage active delivery offers, navigate transit points, scan barcodes, and track digital wallet payouts in one streamlined mobile interface.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Scan className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">QR Verification</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Verify package dispatch, transit custody, and final doorstep delivery using secure, instant QR code scans.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Offline Route Logs</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Continue checking packages and logging client details even without network coverage. Logs automatically sync when you reconnect.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Vetted Backgrounds</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Every driver is verified via official ID, driving license, and active insurance checks before accessing active courier offers.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Escrow Wallet Integration</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Track collected cash-on-delivery amounts and settle payouts directly with regional agencies.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button size="sm" className="h-9 px-4 text-xs font-bold cursor-pointer" asChild>
                <a href="/register/driver">Join Delivery Fleet <ArrowRight className="w-4 h-4 ml-1.5" /></a>
              </Button>
            </div>
          </div>

          {/* Right Column: Premium Mobile Mockup framing photography */}
          <div className="lg:col-span-5 flex justify-center w-full order-1 lg:order-2">
            <div className="relative w-64 border-[6px] border-slate-800 bg-slate-900 rounded-[36px] overflow-hidden shadow-lg aspect-[9/18.5]">
              {/* Speaker & Sensor */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-2" />
                <div className="w-6 h-1 bg-slate-900 rounded-full" />
              </div>
              
              {/* Screen Content */}
              <div className="relative w-full h-full overflow-hidden bg-muted">
                <img 
                  src="/images/driver_app.png" 
                  alt="CargoLink Driver Application Checklist Route Screen" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DriverExperience;
