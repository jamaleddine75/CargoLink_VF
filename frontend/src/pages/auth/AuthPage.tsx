import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForm } from '@/components/auth/AuthForm';
import { Truck, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login, register, LoginCredentials, RegisterData } from '@/services/api/authService';
import { toast } from 'sonner';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  const handleAuth = async (data: LoginCredentials | RegisterData) => {
    try {
      const result = mode === 'login'
        ? await login(data as LoginCredentials)
        : await register(data as RegisterData);

      contextLogin(result.token);
      toast.success(mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!');

      if (role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || "An error occurred";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-8 font-sans relative">
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors z-20 uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full ${mode === 'register' ? 'max-w-[800px]' : 'max-w-[420px]'} space-y-6 transition-all duration-300`}
      >
        {/* Logo header */}
        <div className="text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Join us in a few seconds</p>
        </div>

        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-5">
            {/* Role Selector */}
            <div className="p-1 bg-muted rounded-xl border border-border flex relative w-fit mx-auto min-w-[200px]">
              <motion.div
                layoutId="role-pill"
                className="absolute inset-1 w-[calc(50%-4px)] bg-primary rounded-lg shadow-sm"
                initial={false}
                animate={{ x: role === 'CUSTOMER' ? 0 : '100%' }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
              <button
                onClick={() => setRole('CUSTOMER')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold z-10 transition-colors rounded-lg ${role === 'CUSTOMER' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <User className="w-3.5 h-3.5" />
                Customer
              </button>
              <button
                onClick={() => setRole('DRIVER')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold z-10 transition-colors rounded-lg ${role === 'DRIVER' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
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

            <p className="text-center text-xs text-muted-foreground pt-1 font-medium">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors ml-1"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors ml-1"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground font-medium pt-2">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span className="text-border">|</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

