import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";

const perks = [
  { icon: Clock, text: "Free 14-day trial" },
  { icon: Shield, text: "No credit card required" },
  { icon: HeadphonesIcon, text: "Morocco-based support" },
];

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_60%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto px-6 max-w-7xl">
        <motion.div
          className="relative max-w-4xl mx-auto rounded-3xl bg-primary p-10 md:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
          <motion.div
            className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
              Ready to transform
              <br className="hidden md:block" /> your delivery operations?
            </h2>
            <p className="text-primary-foreground/80 text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
              Join hundreds of Moroccan delivery teams already using CargoLink to save time, reduce costs, and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link to="/register/customer">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-8 h-12 rounded-xl font-semibold shadow-lg"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10 hover:text-primary-foreground text-base px-8 h-12 rounded-xl font-semibold"
              >
                Talk to Sales
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {perks.map((perk) => (
                <div key={perk.text} className="flex items-center gap-2 text-sm text-primary-foreground/70">
                  <perk.icon className="w-4 h-4" />
                  <span>{perk.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
