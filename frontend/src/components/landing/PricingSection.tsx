import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "For small businesses getting started",
    features: ["Up to 500 orders/mo", "1 Agency", "3 Couriers", "Basic analytics", "Email support"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/mo",
    desc: "For growing delivery operations",
    features: ["Up to 5,000 orders/mo", "5 Agencies", "25 Couriers", "Advanced analytics", "COD management", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large-scale delivery networks",
    features: ["Unlimited orders", "Unlimited agencies", "Unlimited couriers", "Custom integrations", "Dedicated account manager", "SLA guarantee"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-card relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-pattern opacity-30" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-5 text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg">Start free, scale as you grow. No hidden fees ever.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`relative p-7 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-card border-primary/40 shadow-card-hover ring-1 ring-primary/10 md:scale-105"
                  : "bg-card border-border shadow-card hover-lift"
              }`}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-hero-gradient text-primary-foreground text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              
              {plan.cta === "Start Free Trial" ? (
                <Link to="/register/customer">
                  <Button
                    variant={plan.highlighted ? "hero" : "outline"}
                    className="w-full mb-6 rounded-xl h-11 font-semibold"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={plan.highlighted ? "hero" : "outline"}
                  className="w-full mb-6 rounded-xl h-11 font-semibold"
                >
                  {plan.cta}
                </Button>
              )}

              <ul className="space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
