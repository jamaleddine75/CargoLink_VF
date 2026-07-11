import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, CreditCard, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="cta" className="py-20 bg-background border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 shadow-md relative overflow-hidden">
          {/* Subtle geometric background line */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%)] [background-size:20px_20px] opacity-20" />
          
          <div className="relative z-10 text-center space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl max-w-2xl mx-auto">
              Optimize Your Regional Shipments Today
            </h2>
            <p className="text-primary-foreground/80 text-sm max-w-xl mx-auto">
              Create a customer account to schedule package pickups, or apply to join our vetted courier fleet as a driver partner.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 bg-white text-primary hover:bg-white/90 shadow-sm cursor-pointer"
                asChild
              >
                <Link to="/register/customer">
                  Ship a Package <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-6 text-xs font-bold border-white/20 text-primary-foreground hover:bg-white/10 cursor-pointer"
                asChild
              >
                <Link to="/register/driver">Register as Driver Partner</Link>
              </Button>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-bold text-primary-foreground/75 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary-foreground/60" />
                <span>Document Vetted Couriers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary-foreground/60" />
                <span>Escrow COD Wallet Settlements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-primary-foreground/60" />
                <span>Regional Transit Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
