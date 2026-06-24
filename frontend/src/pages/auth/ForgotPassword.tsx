import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { forgotPassword } from '@/services/api/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans py-12">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      <Link
        to="/login"
        className="absolute top-10 left-10 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors z-20 group uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to login
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
              Forgot Password
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If <span className="text-foreground font-semibold">{email}</span> is registered,
                  you'll receive a password reset link shortly. Check your inbox and spam folder.
                </p>
                <p className="text-xs text-muted-foreground">The link expires in 1 hour.</p>
                <Link to="/login">
                  <Button variant="outline" className="mt-2 rounded-xl">
                    Back to login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                <Button
                  type="submit"
                  variant="premium"
                  size="premium"
                  className="w-full mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
