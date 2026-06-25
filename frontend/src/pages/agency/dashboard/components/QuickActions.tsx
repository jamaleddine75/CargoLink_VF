import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Wallet, QrCode, ChevronRight, Zap } from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Create Shipment",
      subtitle: "New Order Mission",
      icon: Plus,
      onClick: () => navigate('/agency/create-order'),
      delay: 0.1,
    },
    {
      label: "Assign Driver",
      subtitle: "Fleet Deployment",
      icon: Users,
      onClick: () => navigate('/agency/drivers'),
      delay: 0.2,
    },
    {
      label: "Manage Wallet",
      subtitle: "Finance node",
      icon: Wallet,
      onClick: () => navigate('/agency/wallet'),
      delay: 0.3,
    },
    {
      label: "Batch Scan",
      subtitle: "Sort Logic",
      icon: QrCode,
      onClick: () => navigate('/driver/scan-all'),
      delay: 0.4,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black uppercase tracking-tight ml-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-blue-500" /> Operational Hub
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: action.delay }}
            onClick={action.onClick}
            className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-6 rounded-[32px] hover:bg-blue-600 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-accent/30 group-hover:bg-accent/30 flex items-center justify-center border border-border/40 group-hover:border-border/60 mb-4 transition-colors">
                <action.icon className="w-6 h-6 text-blue-400 group-hover:text-foreground transition-colors" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-tight text-foreground">{action.label}</h4>
              <p className="text-[9px] font-bold text-muted-foreground/40 group-hover:text-foreground/60 uppercase tracking-widest mt-1">{action.subtitle}</p>
            </div>
            <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 group-hover:translate-x-1 transition-all" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
