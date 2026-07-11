import React from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Scan, 
  ShieldCheck, 
  Map, 
  UserCheck, 
  Wallet 
} from "lucide-react";
import { 
  RouteOptimization, 
  QRScannerIllustration, 
  SecureEscrowIllustration, 
  DriverVerificationIllustration,
  MoroccoMap
} from "./LandingIllustrations";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Platform Features</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Built for Secure Regional Delivery
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every feature in CargoLink is designed to solve real logistics challenges in Northern Morocco—from cash collection to dispatch optimization.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          
          {/* Card 1: Route Optimization (Large Card - Span 3 cols) */}
          <div className="md:col-span-3 border border-border bg-card shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">AI Automated Route Optimization</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculate optimal courier paths between pickup locations and regional destination agencies. Utilizes coordinate mapping to minimize travel times and fuel consumption.
              </p>
            </div>
            <div className="w-full flex justify-center bg-muted/30 p-4 rounded-md border border-border/50">
              <RouteOptimization size={280} />
            </div>
          </div>

          {/* Card 2: QR Scanner (Large Card - Span 3 cols) */}
          <div className="md:col-span-3 border border-border bg-card shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Scan className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">QR Verification Scanner</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Eliminate package tracking mistakes with secure hand-off scans. Drivers scan unique package QR codes at pickup, agency check-in, and final delivery to log custody.
              </p>
            </div>
            <div className="w-full flex justify-center bg-muted/30 p-4 rounded-md border border-border/50">
              <QRScannerIllustration size={280} />
            </div>
          </div>

          {/* Card 3: Secure Escrow (Medium Card - Span 2 cols) */}
          <div className="md:col-span-2 border border-border bg-card shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">COD Escrow & Wallet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Secure cash-on-delivery payments directly in driver wallets. Automatically handles agency commissions and logs transparent financial transaction ledgers.
              </p>
            </div>
            <div className="w-full flex justify-center bg-muted/30 p-4 rounded-md border border-border/50">
              <SecureEscrowIllustration size={200} />
            </div>
          </div>

          {/* Card 4: Driver Verification (Medium Card - Span 2 cols) */}
          <div className="md:col-span-2 border border-border bg-card shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Vetted Driver Onboarding</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure safety across your logistics grid. Drivers upload ID credentials, driver's licenses, and vehicle insurance certificates for manual validation by administrators.
              </p>
            </div>
            <div className="w-full flex justify-center bg-muted/30 p-4 rounded-md border border-border/50">
              <DriverVerificationIllustration size={200} />
            </div>
          </div>

          {/* Card 5: Multi-Agency Grid (Medium Card - Span 2 cols) */}
          <div className="md:col-span-2 border border-border bg-card shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Multi-Agency Network</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Establish hubs in multiple operational regions. Maintain dedicated delivery zones, fleet pools, and agency wallets while collaborating on long-haul transit routing.
              </p>
            </div>
            <div className="w-full flex justify-center bg-muted/30 p-4 rounded-md border border-border/50">
              <MoroccoMap size={200} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
