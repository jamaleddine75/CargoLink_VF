import { motion } from "framer-motion";
import { Building2, DollarSign, HeadphonesIcon, ShieldCheck, Timer, Warehouse } from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Multi-Agency Architecture",
    description: "Manage multiple delivery agencies from a single dashboard. Each agency gets its own branding, team, and financial tracking.",
  },
  {
    icon: Timer,
    title: "Real-time Operations",
    description: "Live GPS tracking, instant order assignments, and dynamic route optimization keep your fleet moving efficiently.",
  },
  {
    icon: DollarSign,
    title: "Financial Transparency",
    description: "Automated COD reconciliation, commission splitting, and payout management. No more spreadsheet errors.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Role-based access control, audit trails, encrypted data, and SOC2-grade infrastructure for your peace of mind.",
  },
  {
    icon: Warehouse,
    title: "Multi-Tenant Platform",
    description: "Agencies, clients, drivers, and admins each get a tailored portal with the exact tools they need.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    description: "Morocco-based support team available 6 days a week. Onboarding assistance and training included.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const BenefitsSection = () => {
  return (
    <section id="features" className="landing-section relative">
      <div className="absolute inset-0 -z-10 bg-primary/[0.02]" />

      <div className="mx-auto px-6 max-w-7xl">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Platform Capabilities</div>
          <h2 className="section-title mb-5">
            Everything you need to run
            <br className="hidden md:block" /> deliveries at scale
          </h2>
          <p className="section-desc">
            Purpose-built for the Moroccan logistics ecosystem — from order intake to final-mile delivery and financial reconciliation.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={cardItem}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 hover-lift"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:shadow-lg transition-all duration-300">
                <b.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
