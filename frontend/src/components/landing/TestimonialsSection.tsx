import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Karim Benali",
    role: "CEO, QuickDeliver",
    text: "CargoLink transformed our operations. We went from managing chaos with spreadsheets to having full visibility in real-time. It's been a game changer.",
    avatar: "KB",
  },
  {
    name: "Sarah Dubois",
    role: "Operations Manager, FoodFleet",
    text: "The smart dispatch system alone saved us 3 hours daily. Our couriers are happier, our customers get faster deliveries, and our margins improved.",
    avatar: "SD",
  },
  {
    name: "Marco Rossi",
    role: "Owner, PharmaCourier",
    text: "Managing COD across 5 agencies was a nightmare before. Now every payment is tracked automatically. I can finally sleep at night.",
    avatar: "MR",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-28 relative bg-muted/20">
      <div className="absolute inset-0 -z-10 bg-hero-gradient-soft opacity-80" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            Trusted by delivery teams worldwide
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="group relative p-7 rounded-2xl bg-gradient-to-br from-card via-card to-accent/20 border border-primary/10 ring-1 ring-border/80 shadow-card-hover overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/20"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <Quote className="absolute top-5 right-5 w-8 h-8 text-primary/8" />

              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-display font-bold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
