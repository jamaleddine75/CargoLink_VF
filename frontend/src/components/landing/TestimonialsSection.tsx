import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "CargoLink transformed our delivery operations. We've reduced delivery times by 40% and our COD reconciliation is now fully automated.",
    author: "Youssef El Amrani",
    role: "CEO, LogiMarco",
    initials: "YE",
    rating: 5,
  },
  {
    quote:
      "The real-time tracking and driver management features have given us complete visibility into our fleet. A game-changer for Moroccan logistics.",
    author: "Fatima Benali",
    role: "Operations Director, Express Casa",
    initials: "FB",
    rating: 5,
  },
  {
    quote:
      "We evaluated several platforms, but CargoLink's multi-agency architecture was the only one that matched our complex operational needs.",
    author: "Karim Tazi",
    role: "Founder, Atlas Delivery Network",
    initials: "KT",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const avatarColors = [
  "from-blue-500/20 to-violet-500/20 text-blue-500",
  "from-emerald-500/20 to-cyan-500/20 text-emerald-500",
  "from-amber-500/20 to-rose-500/20 text-amber-500",
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="landing-section relative overflow-hidden">
      <div className="absolute inset-0 premium-gradient pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="section-label">Testimonials</div>
          <h2 className="section-title mb-4">
            Trusted by logistics leaders
          </h2>
          <p className="section-desc">
            Hear from the teams that power Morocco&apos;s delivery ecosystem
            with CargoLink.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div key={t.author} variants={cardVariants}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />

                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold shrink-0",
                        avatarColors[i]
                      )}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.author}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
