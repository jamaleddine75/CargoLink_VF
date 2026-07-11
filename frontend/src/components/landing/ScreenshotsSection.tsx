import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  DashboardMockup,
  DriverIllustration,
  AgencyIllustration,
} from "./LandingIllustrations";

const rows = [
  {
    title: "Powerful admin dashboard",
    desc: "Full visibility into your entire logistics network with real-time metrics, order management, and financial oversight.",
    Illustration: DashboardMockup,
    reversed: false,
  },
  {
    title: "Driver mobile app",
    desc: "Purpose-built for couriers with offline support, turn-by-turn navigation, and digital proof of delivery.",
    Illustration: DriverIllustration,
    reversed: true,
  },
  {
    title: "Agency operations portal",
    desc: "Complete agency management with fleet tracking, order assignment, and financial reconciliation tools.",
    Illustration: AgencyIllustration,
    reversed: false,
  },
];

const ScreenshotsSection = () => {
  return (
    <section id="screenshots" className="landing-section relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="section-label">Platform Preview</div>
          <h2 className="section-title mb-4">See CargoLink in action</h2>
          <p className="section-desc">
            Explore the interfaces that help logistics teams move faster.
          </p>
        </motion.div>

        <div className="space-y-20 md:space-y-32">
          {rows.map((row, i) => (
            <Row key={i} {...row} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

function Row({ title, desc, Illustration, reversed, index }: {
  title: string;
  desc: string;
  Illustration: React.ComponentType<{ className?: string }>;
  reversed: boolean;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
    >
      <motion.div
        initial={{ opacity: 0, x: reversed ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={reversed ? "lg:order-2" : "lg:order-1"}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          0{index + 1}
        </p>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{desc}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: reversed ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`flex justify-center ${reversed ? "lg:order-1" : "lg:order-2"}`}
      >
        <div className="relative group w-full max-w-md">
          <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl scale-110 opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <Illustration className="w-full" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ScreenshotsSection;
