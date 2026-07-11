import React, { useState } from "react";
import { ArrowRight, Building, CheckCircle2, Shield, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MockOrder {
  id: string;
  destination: string;
  amount: number;
  status: "READY_FOR_PICKUP" | "IN_TRANSIT" | "DELIVERED";
  driver: string;
}

const AgencyDashboard = () => {
  // State for interactive order dispatch list replica
  const [orders, setOrders] = useState<MockOrder[]>([
    { id: "CL-9081", destination: "Fnideq", amount: 150, status: "READY_FOR_PICKUP", driver: "Unassigned" },
    { id: "CL-8874", destination: "Chaouen", amount: 320, status: "IN_TRANSIT", driver: "Yassine" },
    { id: "CL-7649", destination: "Tanger", amount: 95, status: "DELIVERED", driver: "Rachid" },
  ]);

  const handleAssign = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, status: "IN_TRANSIT", driver: "Amine" };
      }
      return o;
    }));
  };

  const handleDeliver = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, status: "DELIVERED" };
      }
      return o;
    }));
  };

  return (
    <section id="agency-experience" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: UI Dashboard Replica Mockup */}
          <div className="lg:col-span-7 w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-2xl bg-card border border-border shadow-md rounded-lg overflow-hidden">
              
              {/* Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Agency Portal: Tanger Central Hub
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Stats Cards grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 border border-border p-3 rounded-md space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Active Fleet</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" /> 14 Online
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border p-3 rounded-md space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Pending COD</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" /> 4,120 MAD
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border p-3 rounded-md space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Current Hub</span>
                    <span className="text-sm font-black text-foreground flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-primary" /> Tanger
                    </span>
                  </div>
                </div>

                {/* Orders Dispatch List Table */}
                <div className="border border-border rounded-md overflow-hidden bg-background">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="p-2.5">Order ID</th>
                        <th className="p-2.5">Destination</th>
                        <th className="p-2.5">Driver</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/10">
                          <td className="p-2.5 font-bold">{o.id}</td>
                          <td className="p-2.5 font-semibold text-muted-foreground">{o.destination}</td>
                          <td className="p-2.5 font-semibold">{o.driver}</td>
                          <td className="p-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              o.status === "DELIVERED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : o.status === "IN_TRANSIT"
                                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}>
                              {o.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            {o.status === "READY_FOR_PICKUP" && (
                              <button 
                                onClick={() => handleAssign(o.id)}
                                className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary/95 transition-colors cursor-pointer"
                              >
                                Assign
                              </button>
                            )}
                            {o.status === "IN_TRANSIT" && (
                              <button 
                                onClick={() => handleDeliver(o.id)}
                                className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 transition-colors cursor-pointer"
                              >
                                Complete
                              </button>
                            )}
                            {o.status === "DELIVERED" && (
                              <span className="text-[10px] text-muted-foreground/60 font-bold">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Text Copy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-bold text-primary uppercase tracking-widest">
              Hub Manager Experience
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
              Agency Dispatch and Fleet Consolidation
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every CargoLink agency acts as a logistics center. Manage regional courier directories, optimize dispatch times, consolidate cargo parcels, and manage full wallet withdrawals inside a unified interface.
            </p>

            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Courier Operations Dashboard</strong>
                  Observe active couriers in your operational region, toggle online shifts, and monitor delivery completions.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Independent Wallet Ledger</strong>
                  Agencies track separate wallets collecting delivery fees and commissions, allowing straightforward local withdrawals.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <strong className="text-foreground block font-bold">Automated Reconciliations</strong>
                  Settle driver accounts automatically when Cash-on-Delivery collections are validated by QR scans.
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Button size="sm" className="h-9 px-4 text-xs font-bold cursor-pointer" asChild>
                <a href="/login">Access Portal Command <ArrowRight className="w-4 h-4 ml-1.5" /></a>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AgencyDashboard;
