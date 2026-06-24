import { motion } from "framer-motion";
import { Package, TrendingUp, Users, DollarSign, Clock, ArrowUp, MoreHorizontal } from "lucide-react";

const stats = [
  { label: "Active Orders", value: "142", icon: Package, change: "+12%", up: true },
  { label: "Revenue Today", value: "$4,280", icon: DollarSign, change: "+8.3%", up: true },
  { label: "Online Couriers", value: "34", icon: Users, change: "+3", up: true },
  { label: "Avg Delivery", value: "28 min", icon: Clock, change: "-2 min", up: true },
];

const orders = [
  { id: "#DH-4821", status: "In Transit", customer: "Restaurant Le Bon", courier: "Ahmed K.", amount: "$24.50", progress: 65 },
  { id: "#DH-4820", status: "Delivered", customer: "Pharmacy Plus", courier: "Sara M.", amount: "$18.00", progress: 100 },
  { id: "#DH-4819", status: "Pending", customer: "TechShop Pro", courier: "—", amount: "$45.00", progress: 0 },
  { id: "#DH-4818", status: "Delivered", customer: "Café Central", courier: "Youssef B.", amount: "$12.75", progress: 100 },
  { id: "#DH-4817", status: "In Transit", customer: "BookWorld", courier: "Lina T.", amount: "$32.00", progress: 40 },
];

const statusStyles: Record<string, string> = {
  "In Transit": "bg-primary/10 text-primary border border-primary/20",
  "Delivered": "bg-success/15 text-success border border-success/20",
  "Pending": "bg-warning/15 text-warning border border-warning/20",
};

const DashboardPreview = () => {
  return (
    <section className="py-20 md:py-28 bg-card relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-pattern opacity-30" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border border-primary/20 bg-accent">
            Dashboard Preview
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            Your command center
          </h2>
        </motion.div>

        <motion.div
          className="max-w-5xl mx-auto rounded-2xl border border-border bg-background shadow-card-hover overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-warning/50" />
              <div className="w-3 h-3 rounded-full bg-success/50" />
            </div>
            <div className="flex-1 mx-8">
              <div className="max-w-md mx-auto bg-background rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground font-mono flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success/60" />
                app.cargolink.io/dashboard
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="p-6 space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  className="p-4 rounded-xl bg-card border border-border hover-lift"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-success">
                      <ArrowUp className="w-3 h-3" />
                      {s.change}
                    </div>
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Orders table */}
            <motion.div
              className="rounded-xl border border-border overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <div className="px-5 py-3.5 bg-muted/30 border-b border-border flex items-center justify-between">
                <span className="text-sm font-display font-bold text-foreground">Recent Orders</span>
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">View all →</span>
              </div>
              <div className="divide-y divide-border">
                {orders.map((order, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + i * 0.06 }}
                  >
                    <span className="font-mono font-medium text-foreground w-24">{order.id}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-muted-foreground hidden sm:block w-40 truncate">{order.customer}</span>
                    <span className="text-muted-foreground hidden md:block w-24">{order.courier}</span>
                    <span className="font-display font-bold text-foreground w-16 text-right">{order.amount}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
