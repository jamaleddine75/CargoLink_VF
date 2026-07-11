import React, { useState } from "react";
import { Search, MapPin, Clock, CheckCircle2, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrackingEvent {
  time: string;
  location: string;
  description: string;
  status: "completed" | "current" | "pending";
}

interface OrderTrackingInfo {
  id: string;
  shipper: string;
  courier: string;
  route: string;
  timeline: TrackingEvent[];
}

const mockDatabase: Record<string, OrderTrackingInfo> = {
  "CL-9081": {
    id: "CL-9081",
    shipper: "Amal Shop",
    courier: "Amine (Motorcycle)",
    route: "Tanger → Fnideq",
    timeline: [
      { time: "11:20 AM", location: "Tanger Hub", description: "Shipment checked in and verified", status: "completed" },
      { time: "11:45 AM", location: "Tanger Hub", description: "Courier assigned and handshake scanned", status: "completed" },
      { time: "12:15 PM", location: "N2 Highway", description: "Courier in transit to destination", status: "current" },
      { time: "--:--", location: "Fnideq Agency", description: "Pending doorstep delivery and COD collection", status: "pending" },
    ],
  },
  "CL-8874": {
    id: "CL-8874",
    shipper: "Taza Traders",
    courier: "Yassine (Van)",
    route: "Tetouan → Chaouen",
    timeline: [
      { time: "09:05 AM", location: "Tetouan Agency", description: "Shipment checked in and sorted", status: "completed" },
      { time: "09:30 AM", location: "Tetouan Agency", description: "Courier assigned and handshake scanned", status: "completed" },
      { time: "10:45 AM", location: "Chefchaouen Entry", description: "Shipment arrived at destination sector", status: "completed" },
      { time: "11:15 AM", location: "Chaouen Center", description: "Delivery verified via QR scan. COD amount 320 MAD settled", status: "completed" },
    ],
  },
};

const SmartTracking = () => {
  const [searchId, setSearchId] = useState("CL-9081");
  const [activeTracking, setActiveTracking] = useState<OrderTrackingInfo | null>(mockDatabase["CL-9081"]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = () => {
    const id = searchId.trim().toUpperCase();
    if (mockDatabase[id]) {
      setActiveTracking(mockDatabase[id]);
      setErrorMsg("");
    } else {
      setActiveTracking(null);
      setErrorMsg("No active shipment found with that tracking reference.");
    }
  };

  return (
    <section id="tracking" className="py-20 bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text Copy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-bold text-primary uppercase tracking-widest">
              Live Shipment Tracking
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
              Real-Time Tracking & Verification Timeline
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every shipment on CargoLink generates a tracking page with verified location coordinates, timestamped scan records, courier details, and proof-of-delivery status tags.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. CL-9081, CL-8874" 
                  className="h-10 text-xs border-border bg-card font-mono uppercase tracking-wider"
                />
                <Button onClick={handleSearch} className="h-10 text-xs font-bold px-4 cursor-pointer">
                  <Search className="w-4 h-4 mr-1.5" /> Track
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-muted-foreground">
                <span>Try operational demos:</span>
                <button 
                  onClick={() => { setSearchId("CL-9081"); setActiveTracking(mockDatabase["CL-9081"]); setErrorMsg(""); }}
                  className="px-2 py-0.5 border border-border rounded hover:bg-muted bg-card transition-colors font-mono cursor-pointer"
                >
                  CL-9081 (In Transit)
                </button>
                <button 
                  onClick={() => { setSearchId("CL-8874"); setActiveTracking(mockDatabase["CL-8874"]); setErrorMsg(""); }}
                  className="px-2 py-0.5 border border-border rounded hover:bg-muted bg-card transition-colors font-mono cursor-pointer"
                >
                  CL-8874 (Delivered)
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-destructive font-semibold">{errorMsg}</p>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Timeline View */}
          <div className="lg:col-span-7 flex justify-center w-full">
            {activeTracking ? (
              <div className="w-full max-w-xl bg-card border border-border shadow-md rounded-lg overflow-hidden">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="text-xs font-bold text-foreground font-mono">
                    Shipment ID: {activeTracking.id}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> {activeTracking.courier}
                  </div>
                </div>

                {/* Tracking Details Summary */}
                <div className="px-5 py-3 border-b border-border bg-muted/10 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Route: {activeTracking.route}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-border" />
                  <span>Shipper: {activeTracking.shipper}</span>
                </div>

                {/* Timeline Items */}
                <div className="p-5 space-y-6">
                  {activeTracking.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 relative">
                      {/* Left indicator line */}
                      {index < activeTracking.timeline.length - 1 && (
                        <div className={`absolute left-3 top-6 bottom-[-24px] w-0.5 ${
                          event.status === "completed" ? "bg-primary" : "bg-border"
                        }`} />
                      )}
                      
                      {/* Node Indicator */}
                      <div className="relative z-10 shrink-0">
                        {event.status === "completed" ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-primary flex items-center justify-center text-white border-2 border-card shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : event.status === "current" ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-primary/20 flex items-center justify-center border border-primary border-dashed shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground/60">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Event Text */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                          <span className="text-xs font-bold text-foreground">{event.location}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl h-64 bg-card border border-border shadow-sm rounded-lg flex items-center justify-center text-muted-foreground text-xs font-semibold">
                Select or search a shipment ID to display tracking details.
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default SmartTracking;
