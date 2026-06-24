import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, User, ArrowLeft, ShieldCheck, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const RegisterSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      title: 'Register as Customer',
      description: 'Sign up to manage your logistics, track packages, and create new delivery orders.',
      icon: <User className="w-8 h-8" />,
      route: '/register/customer',
      color: 'bg-sky-500',
    },
    {
      id: 'driver',
      title: 'Join as Driver',
      description: 'Start earning today. Access your delivery schedule and manage active routes.',
      icon: <Truck className="w-8 h-8" />,
      route: '/register/driver',
      color: 'bg-sky-500',
    }
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden transition-colors duration-500 font-sans selection:bg-primary/30 py-20">
      {/* Dynamic Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-60 ml-2" />
        <div className="absolute inset-0 grid-pattern opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors z-20 group uppercase tracking-widest"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <div className="relative z-10 w-full max-w-4xl space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-3 mb-2"
            >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                    <Truck className="w-8 h-8 text-white" />
                </div>
                <span className="text-4xl font-black tracking-tighter text-foreground">CargoLink</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Start Your Journey</h1>
            <p className="text-muted-foreground font-medium text-lg max-w-lg mx-auto leading-relaxed">
              Create your account in just a few steps. Please choose your role to continue.
            </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4">
            {roles.map((role, index) => (
                <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onClick={() => navigate(role.route)}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                    
                    <div className="h-full bg-card/40 backdrop-blur-3xl border border-border/50 rounded-[32px] p-8 md:p-10 transition-all group-hover:border-primary/30 group-hover:bg-card/60 shadow-2xl overflow-hidden relative">
                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${role.color}/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity`} />

                        <div className="space-y-6 relative z-10">
                            <div className={`w-16 h-16 rounded-2xl ${role.color} flex items-center justify-center text-white shadow-xl shadow-white/5`}>
                                {role.icon}
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">{role.title}</h3>
                                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                                    {role.description}
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-2 text-sky-500 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                Sign Up Now <Rocket className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Bottom Branding */}
        <div className="text-center pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 border border-border/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Fast & Reliable Onboarding
            </div>
            
            <p className="mt-8 text-muted-foreground/60 font-bold text-[10px] uppercase tracking-widest">
                Already have an account? <Link to="/login" className="text-primary hover:text-primary-foreground transition-colors bg-primary/10 px-3 py-1 rounded-full">Sign In Now</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelection;
