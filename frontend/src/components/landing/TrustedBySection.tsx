import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const companies = [
  { name: "LogiMarco" },
  { name: "Express Casa" },
  { name: "MediTrans" },
  { name: "Atlas Delivery" },
  { name: "NordLogistic" },
  { name: "Sahara Express" },
];

const duplicated = [...companies, ...companies, ...companies];

const TrustedBySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section id="trusted" className="py-16 md:py-20 border-y border-border/40" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-10"
        >
          Trusted by Morocco&apos;s leading logistics companies
        </motion.p>

        <div className="hidden md:flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {companies.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 transition-all hover-lift"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{c.name.charAt(0)}</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{c.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden overflow-hidden relative">
          <div className="flex absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="flex absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            className="flex gap-6"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {duplicated.map((c, i) => (
              <div
                key={`${c.name}-${i}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/30 bg-card/50 shrink-0"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{c.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">{c.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
