import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Package, TrendingUp, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stats = [
  { icon: Package, value: "1.2M+", label: "Orders Processed" },
  { icon: UserCheck, value: "8,500+", label: "Active Couriers" },
  { icon: MapPin, value: "45+", label: "Cities Covered" },
  { icon: TrendingUp, value: "99.4%", label: "Delivery Success" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto px-6 max-w-7xl">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="mb-6 inline-flex">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Trusted by 500+ delivery teams
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.06] mb-6 text-foreground"
          >
            The operating system for
            <br />
            <span className="text-primary">delivery logistics</span> in Morocco
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From order creation to final delivery — manage your entire fleet, finances, 
            and customer experience from one centralized platform.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register/customer">
              <Button size="lg" className="text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
                Start Shipping <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/register/driver">
              <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-xl">
                Join as a Courier
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-20 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border/60 hover:border-border hover-lift"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
