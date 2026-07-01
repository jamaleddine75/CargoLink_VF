import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForm } from '@/components/auth/AuthForm';
import { Button } from "@/components/ui/button";
import { Truck, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login, register } from '@/services/api/authService';
import { toast } from 'sonner';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Default to 'register' if on /register path, 'login' if on /login path, otherwise check query params
  const initialMode = location.pathname === '/register' 
    ? 'register' 
    : location.pathname === '/login'
    ? 'login'
    : (searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const initialRole = searchParams.get('role')?.toUpperCase() === 'DRIVER' ? 'DRIVER' : 'CUSTOMER';
  const [role, setRole] = useState<'CUSTOMER' | 'DRIVER'>(initialRole);
  const { login: contextLogin } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (data: unknown) => {
    try {
      const result = mode === 'login' 
        ? await login(data) 
        : await register(data);
      
      contextLogin(result.token);
      toast.success(mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!');
      
      if (role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      toast.error(error.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans selection:bg-primary/30 py-2 transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-60 ml-2" />
        <div className="absolute inset-0 grid-pattern opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors z-20 group"
      >
        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full ${mode === 'register' ? 'max-w-[800px]' : 'max-w-[450px]'} px-4 transition-all duration-500`}
      >
        <div className="bg-card/40 backdrop-blur-2xl border border-border/50 p-5 md:p-6 rounded-[28px] shadow-2xl space-y-3">
          
          <div className="text-center space-y-1">
            <motion.div 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground mb-1"
            >
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              CargoLink
            </motion.div>
            
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-muted-foreground text-xs font-medium">
              Join us in few seconds
            </p>
          </div>

          {/* Role Selector Pill */}
          <div className="p-1 bg-muted/60 dark:bg-slate-950/60 rounded-full border border-border flex relative w-fit mx-auto min-w-[200px]">
            <motion.div
              layoutId="role-pill"
              className="absolute inset-1 w-[calc(50%-4px)] bg-primary rounded-full shadow-lg shadow-primary/20"
              initial={false}
              animate={{ x: role === 'CUSTOMER' ? 0 : '100%' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
            <button
              onClick={() => setRole('CUSTOMER')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold z-10 transition-colors ${role === 'CUSTOMER' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              onClick={() => setRole('DRIVER')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold z-10 transition-colors ${role === 'DRIVER' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <Truck className="w-3.5 h-3.5" />
              Delivery
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${role}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <AuthForm mode={mode} role={role} onSubmit={handleAuth} />
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground pt-1">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button 
                  onClick={() => setMode('register')} 
                  className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors ml-1"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors ml-1"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground font-medium">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
