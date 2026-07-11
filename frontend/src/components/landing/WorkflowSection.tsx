import React from "react";
import { FileText, Building2, Truck, CheckSquare } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Order Dispatch",
    description:
      "Client creates a delivery order specifying sender and receiver locations. System calculates distance and secures pricing.",
  },
  {
    number: "02",
    icon: Building2,
    title: "Agency Consolidation",
    description:
      "The regional agency receives the package, checks routing directions, and prepares sorting dispatch lists.",
  },
  {
    number: "03",
    icon: Truck,
    title: "Courier Handshake",
    description:
      "Vetted couriers receive delivery logs, execute real-time routing navigation, and scan package QR codes on arrival.",
  },
  {
    number: "04",
    icon: CheckSquare,
    title: "COD Wallet Settlement",
    description:
      "Cash is collected, driver's digital wallet balances update, and regional agency commissions are reconciled.",
  },
];

const WorkflowSection = () => {
  return (
    <section id="workflow" className="py-20 bg-muted/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Delivery Lifecycle</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How CargoLink Works
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A secure and unified process flow that guarantees package safety and financial reconciliation from checkout to doorstep.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <div key={step.title} className="bg-card border border-border rounded-lg p-6 relative space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground/60">{step.number}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
