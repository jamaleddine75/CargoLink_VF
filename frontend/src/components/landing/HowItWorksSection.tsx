import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, Bike, CreditCard, ArrowRight } from "lucide-react";

const steps = [
  { icon: ShoppingCart, title: "Customer Creates Order", desc: "Business places a delivery request via the platform or API." },
  { icon: CheckCircle, title: "Agency Validates", desc: "The agency reviews, confirms, and assigns the order." },
  { icon: Bike, title: "Courier Delivers", desc: "Optimally assigned courier picks up and delivers the order." },
  { icon: CreditCard, title: "Payment Confirmed", desc: "COD collected and finances reconciled automatically." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-card relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-pattern opacity-40" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            How it Works
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground leading-tight">
            From order to delivery
            <br className="hidden md:block" /> in 4 simple steps
          </h2>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line with gradient */}
          <div className="hidden lg:block absolute top-20 left-[15%] right-[15%] h-0.5 overflow-hidden">
            <motion.div
              className="h-full bg-hero-gradient"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
              >
                <div className="relative z-10 mb-5">
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-bold text-foreground mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{step.desc}</p>
                {i < 3 && (
                  <ArrowRight className="w-5 h-5 text-primary/30 mt-4 hidden lg:hidden md:hidden" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
