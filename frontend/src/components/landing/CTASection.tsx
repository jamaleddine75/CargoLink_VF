import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative max-w-4xl mx-auto rounded-3xl bg-hero-gradient p-12 md:p-20 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Animated light effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.18),transparent_60%)]" />
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              Ready to streamline
              <br className="hidden md:block" /> your deliveries?
            </h2>
            <p className="text-primary-foreground/75 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of delivery teams already using CargoLink to save time, reduce errors, and grow faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register/customer">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-8 h-12 rounded-xl font-semibold shadow-lg transition-all">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10 hover:text-primary-foreground text-base px-8 h-12 rounded-xl font-semibold transition-all"
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
