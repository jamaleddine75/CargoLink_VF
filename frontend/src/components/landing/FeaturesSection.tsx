import { motion } from "framer-motion";
import { ClipboardList, Bike, DollarSign, MapPin, Building2, BarChart3, ArrowUpRight } from "lucide-react";

const features = [
  { icon: ClipboardList, title: "Order Management", desc: "Create, assign, track, and archive orders with full lifecycle control and audit trails." },
  { icon: Bike, title: "Courier Dashboard", desc: "Couriers get their own mobile-ready dashboard with routes, earnings, and performance stats." },
  { icon: DollarSign, title: "Financial System", desc: "Automated COD tracking, commissions, invoicing, and payout reports — all in one place." },
  { icon: MapPin, title: "Real-time Tracking", desc: "Live GPS tracking with ETA predictions, geofencing, and customer notifications." },
  { icon: Building2, title: "Agency Management", desc: "Multi-tenant support with role-based access, custom branding, and team management." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Actionable insights on delivery performance, revenue trends, and operational efficiency." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-5 text-foreground leading-tight">
            Built for modern
            <br className="hidden md:block" /> delivery operations
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Every tool your team needs — powerful, intuitive, and designed to scale.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/20 shadow-card hover-lift cursor-default overflow-hidden"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-4 h-4 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-hero-gradient group-hover:shadow-md transition-all duration-300">
                <f.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2 text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
