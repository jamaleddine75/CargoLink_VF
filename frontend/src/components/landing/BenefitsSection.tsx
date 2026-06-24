import { motion } from "framer-motion";
import { Radio, Building2, Zap, PiggyBank } from "lucide-react";

const benefits = [
  {
    icon: Radio,
    title: "Real-time Tracking",
    description: "Track every delivery live on the map. Customers get instant updates and accurate ETAs.",
    color: "from-blue-500/20 to-blue-600/20",
  },
  {
    icon: Building2,
    title: "Multi-Agency Management",
    description: "Manage multiple agencies from one dashboard. Scale operations without added complexity.",
    color: "from-blue-400/20 to-blue-500/20",
  },
  {
    icon: Zap,
    title: "Smart Courier Dispatch",
    description: "AI-powered order assignment prevents overload and optimizes routes automatically.",
    color: "from-blue-300/20 to-blue-400/20",
  },
  {
    icon: PiggyBank,
    title: "Financial Transparency",
    description: "Full visibility into COD, commissions, and payouts. No more spreadsheet chaos.",
    color: "from-blue-500/20 to-blue-700/20",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 -z-10 bg-hero-gradient-soft" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            Why CargoLink
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-5 text-foreground leading-tight">
            Everything you need to run
            <br className="hidden md:block" /> deliveries at scale
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From order creation to final delivery — manage every step with confidence and full control.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              className="group relative p-6 rounded-2xl bg-card border border-border shadow-card hover-lift overflow-hidden"
              custom={i}
              variants={cardVariant}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {/* Gradient hover bg */}
              <div className={`absolute inset-0 bg-gradient-to-br ${b.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:bg-hero-gradient group-hover:shadow-lg transition-all duration-300">
                  <b.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-foreground">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
