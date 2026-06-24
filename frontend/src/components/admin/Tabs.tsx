import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex items-center p-1.5 bg-muted/20 backdrop-blur-md rounded-2xl border border-border/40 w-full md:w-fit", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 focus:outline-none rounded-xl flex items-center gap-2",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary shadow-lg shadow-primary/30 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-black",
                isActive ? "bg-white/20 text-white" : "bg-muted/40 text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
