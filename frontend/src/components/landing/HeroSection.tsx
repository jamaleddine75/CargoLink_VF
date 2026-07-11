import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-background pt-24 md:pt-28 pb-16">
      {/* Sleek Minimalist Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_60%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-bold text-foreground uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live in Tanger, Tetouan, Fnideq, Mdiq & Chaouen
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Direct-to-Destination <br />
              <span className="text-primary">Logistics Platform</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Connect clients, couriers, and regional transit hubs on a single platform. Automate route planning, lock down cash-on-delivery escrow, and verify every hand-off in real time.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:justify-start gap-3">
              <Button size="lg" className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 cursor-pointer" asChild>
                <Link to="/register/customer">
                  Ship a Package <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6 text-xs font-bold border-border cursor-pointer" asChild>
                <Link to="/register/driver">
                  Become a Driver Partner <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            <div className="pt-6 border-t border-border flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Escrow Secured (COD)</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Premium Framed Logistics Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="lg:col-span-5 flex justify-center w-full"
          >
            <div className="relative w-full max-w-md bg-card border border-border shadow-md rounded-lg overflow-hidden">
              {/* Card Window Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  Tanger Dispatch Hub
                </div>
              </div>
              
              {/* Commercial Photography Asset */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img 
                  src="/images/van.png" 
                  alt="CargoLink Delivery Fleet in Tanger, Morocco" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm border border-border rounded px-2.5 py-1 text-[9px] font-bold text-foreground shadow-sm">
                  Active Fleet Route: Tanger Hub → Tetouan Agency
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
