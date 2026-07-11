import { motion } from "framer-motion";
import { BarChart3, Globe, Map, Smartphone, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "GPS-enabled live tracking with ETAs, geofencing alerts, and automated customer notifications at every milestone.",
  },
  {
    icon: Users,
    title: "Role-Based Portals",
    description: "Dedicated dashboards for admins, agencies, drivers, and customers — each with the exact tools they need.",
  },
  {
    icon: Map,
    title: "Route Optimization",
    description: "Smart dispatch assigns orders to the nearest available courier, reducing wait times and fuel costs.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Driver App",
    description: "Offline-capable driver app with GPS navigation, proof of delivery capture, and earnings tracking.",
  },
  {
    icon: Globe,
    title: "Multi-City Coverage",
    description: "Operating across 45+ Moroccan cities — from Tangier to Laayoune — with local expertise in every region.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Comprehensive dashboards with delivery KPIs, revenue trends, driver performance, and financial reconciliation.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="landing-section relative">
      <div className="mx-auto px-6 max-w-7xl">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Why CargoLink</div>
          <h2 className="section-title mb-5">
            Built for Moroccan
            <br className="hidden md:block" /> delivery operations
          </h2>
          <p className="section-desc">
            Every feature is designed to solve real logistics challenges — from navigating Moroccan cities to managing COD payments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 hover-lift"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:shadow-lg transition-all duration-300">
                <f.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
