import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "CargoLink transformed how we manage deliveries across Casablanca and Rabat. We reduced delivery times by 35% in the first month.",
    author: "Youssef El Amrani",
    role: "Operations Director, ExpressLog Maroc",
  },
  {
    quote: "The financial reconciliation alone saved us 20 hours of manual work per week. COD tracking is finally automatic and accurate.",
    author: "Fatima Benali",
    role: "CEO, Medina Delivery Services",
  },
  {
    quote: "Our drivers love the mobile app. Turn-by-turn navigation and digital proof of delivery eliminated disputes with customers.",
    author: "Karim Tazi",
    role: "Fleet Manager, RapidShip.ma",
  },
];

const cities = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger",
  "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan",
  "Safi", "El Jadida", "Nador", "Beni Mellal", "Laâyoune",
];

const DashboardPreview = () => {
  return (
    <section id="testimonials" className="landing-section relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-primary/[0.02]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto px-6 max-w-7xl">
        {/* Testimonials */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Testimonials</div>
          <h2 className="section-title mb-5">
            Trusted by delivery teams
            <br className="hidden md:block" /> across Morocco
          </h2>
          <p className="section-desc">
            Hear from the agencies and fleet managers who use CargoLink to power their daily operations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="relative p-6 md:p-8 rounded-2xl bg-card border border-border/60"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Quote className="w-8 h-8 text-primary/15 mb-4" />
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.author}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cities coverage */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Coverage</div>
          <h2 className="section-title mb-5">
            Serving 45+ cities
            <br className="hidden md:block" /> across Morocco
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {cities.map((city, i) => (
            <motion.span
              key={city}
              className="px-4 py-2 rounded-xl bg-card border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover-lift"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              {city}
            </motion.span>
          ))}
          <span className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-sm font-semibold text-primary">
            +30 more
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
