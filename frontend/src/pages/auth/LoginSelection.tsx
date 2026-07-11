import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, User, ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LoginSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      title: 'I am a Customer',
      description: 'Manage your logistics, track packages, and create new delivery orders.',
      icon: <User className="w-6 h-6 text-primary" />,
      route: '/login/customer',
    },
    {
      id: 'driver',
      title: 'I am a Driver',
      description: 'Access your delivery schedule, track earnings, and manage active routes.',
      icon: <Truck className="w-6 h-6 text-primary" />,
      route: '/login/driver',
    }
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-16 font-sans relative overflow-hidden">
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors z-20 uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <div className="w-full max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 mb-1"
          >
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">CargoLink</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground font-medium text-sm max-w-md mx-auto leading-relaxed">
            Please select your account type to continue to the login page.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(role.route)}
              className="cursor-pointer"
            >
              <Card className="h-full bg-card border border-border rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:border-primary/40 shadow-sm">
                <CardContent className="p-0 space-y-5">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {role.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{role.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-semibold text-xs tracking-tight hover:underline">
                    Log In Now <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground border border-border uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Single Sign-On
          </div>
          <p className="text-xs text-muted-foreground">
            New to CargoLink?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold ml-1">Start Free Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;

