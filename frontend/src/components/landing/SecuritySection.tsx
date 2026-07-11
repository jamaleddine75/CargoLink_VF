import React from "react";
import {
  Lock,
  Users,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Vetted Courier Onboarding",
    description:
      "All driver partners go through manual validation checks. Drivers must provide valid government ID, driver licenses, and vehicle insurance certificates before receiving transport requests.",
  },
  {
    icon: Users,
    title: "Granular Portal Authorization",
    description:
      "Independent portal logins for Customers, Drivers, Agencies, and Administrators ensure users only access information and wallet assets relevant to their specific role.",
  },
  {
    icon: FileCheck,
    title: "Law 09-08 Compliance",
    description:
      "Fully compliant with Moroccan data protection law (CNDP Law 09-08). Client shipment details and personal contact information are strictly encrypted in transit.",
  },
  {
    icon: ShieldAlert,
    title: "Cash-on-Delivery Escrow Safeguards",
    description:
      "Driver wallets automatically track collected Cash-on-Delivery amounts. Cash balances remain locked until verified and cleared by the corresponding transit agency.",
  },
  {
    icon: ShieldCheck,
    title: "QR Delivery Handshakes",
    description:
      "Every step of the package transit is scanned. The system enforces QR scans at pickup, hub sorting, and delivery points, logging custody trails.",
  },
  {
    icon: CreditCard,
    title: "Secure Financial Auditing",
    description:
      "Complete transparency on commissions, shipping charges, and wallet histories. Immutable transaction logs prevent balance discrepancies.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-20 bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Platform Security</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Vetted Partners & Verified Payments
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From driver vetting to cash-on-delivery tracking, CargoLink guarantees operations run securely and transparently.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature) => (
            <div key={feature.title} className="bg-card border border-border rounded-lg p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
