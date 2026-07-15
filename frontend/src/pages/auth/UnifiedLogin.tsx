import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { login } from '@/services/api/authService';
import { useAuth } from '@/context/AuthContext';

const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login: authLogin, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      
      // Update global context
      authLogin(response.token);

      toast.success('Login successful!');
      
      const destination = getDashboardPath(response.role);
      
      setTimeout(() => {
        navigate(destination);
      }, 100);
    } catch (error: unknown) {
      const axiosError = axios.isAxiosError(error) ? error : null;
      const message = axiosError?.response?.data?.message || 'Login failed. Please check your credentials.';
      const status = axiosError?.response?.status;
      const errorType = axiosError?.response?.data?.error;
      
      if (
        (status === 403 || status === 401) && 
        (message.toLowerCase().includes('review') || message.toLowerCase().includes('activé') || errorType === 'Account Disabled')
      ) {
        localStorage.setItem('pendingEmail', email);
        navigate('/pending-approval');
      } else if (status === 429) {
        // toast is already shown by apiClient interceptor
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    if (!isDev) return;
    switch (role) {
      case 'admin':
        setEmail('admin@cargolink.ma');
        setPassword('demo123');
        break;
      case 'agency':
        setEmail('agency@cargolink.ma');
        setPassword('demo123');
        break;
      case 'driver':
        setEmail('driver@cargolink.ma');
        setPassword('demo123');
        break;
      case 'client':
        setEmail('client@cargolink.ma');
        setPassword('demo123');
        break;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-12 font-sans relative">
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
        className="w-full max-w-[420px] space-y-6"
      >
        {/* Logo header */}
        <div className="text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">User Portal</h1>
          <p className="text-xs text-muted-foreground mt-1">Customer and Driver Authentication</p>
        </div>

        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground ml-1">
                  Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-background border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 transition-all ${
                      errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/60 focus:ring-primary/20 focus:border-primary/50'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground ml-1">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-background border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 transition-all ${
                      errors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/60 focus:ring-primary/20 focus:border-primary/50'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Dashboard'}
              </button>
            </form>

            <div className="border-t border-border pt-4 flex flex-col gap-4">
              {isDev && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <button type="button" onClick={() => fillDemo('admin')} className="text-[10px] font-semibold h-7 px-3 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors">Admin</button>
                  <button type="button" onClick={() => fillDemo('agency')} className="text-[10px] font-semibold h-7 px-3 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-colors">Agency</button>
                  <button type="button" onClick={() => fillDemo('driver')} className="text-[10px] font-semibold h-7 px-3 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">Driver</button>
                  <button type="button" onClick={() => fillDemo('client')} className="text-[10px] font-semibold h-7 px-3 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">Client</button>
                </div>
              )}
              <p className="text-muted-foreground text-xs text-center font-medium">
                Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UnifiedLogin;

