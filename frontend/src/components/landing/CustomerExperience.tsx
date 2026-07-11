import React, { useState } from "react";
import { ArrowRight, Calculator, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CITIES } from "@/constants/supportedCities";

const CustomerExperience = () => {
  // Mock form state for live interactive preview
  const [senderCity, setSenderCity] = useState("TANGER");
  const [receiverCity, setReceiverCity] = useState("TETOUAN");
  const [codAmount, setCodAmount] = useState("250");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isHeavy, setIsHeavy] = useState(false);

  // Dynamic price calculation similar to backend service logic
  const calculatePrice = () => {
    let base = 35; // Standard shipping rate in MAD
    if (senderCity === receiverCity) base = 25; // Intra-city discount
    if (isUrgent) base += 15;
    if (isHeavy) base += 25;
    return base;
  };

  return (
    <section id="customer-experience" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: UI Form Replica Mockup */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-lg bg-card border border-border shadow-md rounded-lg overflow-hidden">
              
              {/* Window Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Customer Portal: Create Shipment
                </span>
              </div>

              {/* Form Content Replica */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sender City</Label>
                    <Select value={senderCity} onValueChange={setSenderCity}>
                      <SelectTrigger className="h-9 text-xs border-border bg-card rounded-md cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {SUPPORTED_CITIES.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Receiver City</Label>
                    <Select value={receiverCity} onValueChange={setReceiverCity}>
                      <SelectTrigger className="h-9 text-xs border-border bg-card rounded-md cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {SUPPORTED_CITIES.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">COD Amount (Dirhams)</Label>
                  <Input 
                    type="number" 
                    value={codAmount} 
                    onChange={(e) => setCodAmount(e.target.value)} 
                    className="h-9 text-xs border-border bg-card" 
                    placeholder="Cash on Delivery amount"
                  />
                </div>

                {/* Additional Option Switches */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isUrgent} 
                      onChange={(e) => setIsUrgent(e.target.checked)} 
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-foreground">Urgent Delivery (+15 MAD)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isHeavy} 
                      onChange={(e) => setIsHeavy(e.target.checked)} 
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-foreground">Heavy Cargo (+25 MAD)</span>
                  </label>
                </div>

                {/* Dynamic Price Display */}
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-primary/10 bg-primary/5 text-primary">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Estimated Shipping cost</span>
                  </div>
                  <span className="text-lg font-black">{calculatePrice()} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Text Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-bold text-primary uppercase tracking-widest">
              Shipper Experience
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
              Create, Calculate, and Track Instantly
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create shipments in under a minute. Input pickup locations, specify destination hubs, set Cash-on-Delivery collections, and track live logistics coordinates from any device.
            </p>

            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Transparent Transit Rates</strong>
                  Pricing is automatically locked in before delivery dispatch based on cargo weight and speed constraints.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Consolidated Address Book</strong>
                  Save and manage repeat client addresses to minimize order creation errors.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Financial Safeguards</strong>
                  Automatic escrow tracking logs collected COD amounts and settles accounts directly with shipping agencies.
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Button size="sm" className="h-9 px-4 text-xs font-bold cursor-pointer" asChild>
                <a href="/register/customer">Start Shipping Now <ArrowRight className="w-4 h-4 ml-1.5" /></a>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CustomerExperience;
