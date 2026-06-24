import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Book } from 'lucide-react';
import AddressBook from '@/components/client/AddressBook';

export default function AddressBookPage() {
  return (
    <div className="space-y-12 pb-12 relative z-10">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <header>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70">Personal Logistics Hub</p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-foreground">
            My <span className="text-primary drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Address Book</span>
          </h1>
          <p className="text-muted-foreground/60 mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
             <Book className="w-4 h-4 text-primary/50" /> Manage your frequent delivery points for faster checkout.
          </p>
        </motion.div>
      </header>

      <div className="relative z-10">
        <AddressBook />
      </div>
    </div>
  );
}
