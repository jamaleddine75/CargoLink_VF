import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Users, UserCheck, Shield, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      newErrors.email = 'Email range required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Valid email required';
    }
    
    if (!password) {
      newErrors.password = 'Password required';
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
      
      // Update global context (this will also parse the role)
      authLogin(response.token);

      toast.success('Login successful!');
      
      // Resolve dashboard path based on role
      const destination = getDashboardPath(response.role);
      navigate(destination);
    } catch (error: unknown) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      const status = error.response?.status;
      const errorType = error.response?.data?.error;
      
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans selection:bg-primary/30 py-12 transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-40 dark:opacity-60 ml-2" />
        <div className="absolute inset-0 grid-pattern opacity-20 dark:opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 dark:bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/5 dark:bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      <Link 
        to="/" 
        className="absolute top-10 left-10 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors z-20 group uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[450px]"
      >
        <Card className="border-border/50 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[32px] overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-3">
              <Truck className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">
              User Portal
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Customer and Driver Authentication
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-accent/30 border-border rounded-2xl text-foreground transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Password
                  </Label>
                  <Link to="/forgot-password" university-id="forgot-pass-link" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-accent/30 border-border rounded-2xl text-foreground transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="premium"
                size="premium"
                className="w-full mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Access Dashboard"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="pb-10 pt-4 px-10 text-center flex flex-col gap-4">
            {isDev && (
              <div className="w-full flex flex-wrap gap-2 justify-center mb-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo('admin')} className="text-[10px] uppercase tracking-widest h-8 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border-0 transition-colors">Admin</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo('agency')} className="text-[10px] uppercase tracking-widest h-8 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border-0 transition-colors">Agency</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo('driver')} className="text-[10px] uppercase tracking-widest h-8 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-0 transition-colors">Driver</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo('client')} className="text-[10px] uppercase tracking-widest h-8 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border-0 transition-colors">Client</Button>
              </div>
            )}
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
              Don't have an account? <Link to="/register" className="text-primary hover:underline group-hover:text-primary/80">Register</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default UnifiedLogin;
