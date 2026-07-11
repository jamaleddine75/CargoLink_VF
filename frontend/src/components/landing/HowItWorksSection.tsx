import { motion } from "framer-motion";
import { ClipboardList, Bike, CreditCard, UserCheck } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Order Created",
    description: "A customer or agency places a delivery request. Details, address, and COD amount are captured instantly.",
  },
  {
    icon: UserCheck,
    title: "Agency Validates & Assigns",
    description: "The agency reviews the order, confirms pricing, and assigns the nearest available courier.",
  },
  {
    icon: Bike,
    title: "Courier Delivers",
    description: "The courier receives turn-by-turn navigation, picks up the package, and delivers it with real-time proof.",
  },
  {
    icon: CreditCard,
    title: "Payment Reconciled",
    description: "COD is collected, commissions are split automatically, and earnings are available for withdrawal.",
  },
];

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] },
  }),
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="landing-section bg-card relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.03),transparent_60%)]" />

      <div className="mx-auto px-6 max-w-7xl">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">How It Works</div>
          <h2 className="section-title mb-5">
            From order to delivery
            <br className="hidden md:block" /> in four steps
          </h2>
          <p className="section-desc">
            A streamlined workflow designed for the Moroccan delivery ecosystem. Every step is tracked, transparent, and optimized.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center relative"
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center text-[11px] font-bold text-primary shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
