import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Package, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-28 overflow-hidden">
      {/* Mesh background */}
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <div className="absolute inset-0 -z-10 grid-pattern opacity-60" />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-32 left-[10%] w-80 h-80 glow-orb rounded-full -z-10"
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-[10%] w-96 h-96 glow-orb rounded-full -z-10"
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >


          <motion.h1
            variants={item}
            className="text-5xl md:text-7xl lg:text-[5rem] font-display font-bold tracking-tight leading-[1.08] mb-6"
          >
            The all-in-one
            <br />
            platform for{" "}
            <span className="text-gradient">delivery management</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Manage orders, couriers, and finances across multiple agencies — all from one beautiful, centralized dashboard.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register/customer">
              <Button variant="hero" size="lg" className="text-base px-8 h-12 rounded-xl">
                Start as Customer <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/register/driver">
              <Button variant="hero-outline" size="lg" className="text-base px-8 h-12 rounded-xl">
                Join as Driver
              </Button>
            </Link>
          </motion.div>

          {/* Stat cards with stagger */}
          <motion.div
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              { icon: Package, label: "Orders processed", value: "1.2M+" },
              { icon: MapPin, label: "Active couriers", value: "8,500+" },
              { icon: TrendingUp, label: "Delivery success", value: "99.4%" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={item}
                className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-card shadow-card border border-border hover-lift cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-hero-gradient transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
