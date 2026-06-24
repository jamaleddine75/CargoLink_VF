import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, RefreshCw, Clock, XCircle,
  CheckCircle2, Mail, HelpCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'loading' | 'error';

interface StatusConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  glowColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    icon: Clock,
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-400',
    title: 'Account Under Review',
    description: 'Your registration is being reviewed by our team. This usually takes up to 24 hours.',
    glowColor: 'bg-amber-500/10',
  },
  APPROVED: {
    icon: CheckCircle2,
    iconBg: 'bg-green-500/20 border-green-500/30',
    iconColor: 'text-green-400',
    title: 'Account Approved!',
    description: 'Your account has been approved. You can now log in and access the platform.',
    glowColor: 'bg-green-500/10',
  },
  REJECTED: {
    icon: XCircle,
    iconBg: 'bg-red-500/20 border-red-500/30',
    iconColor: 'text-red-400',
    title: 'Application Rejected',
    description: 'Unfortunately, your application was not approved at this time.',
    glowColor: 'bg-red-500/10',
  },
};

const PendingApproval = () => {
  const [status, setStatus] = useState<AccountStatus>('loading');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      // Try to get the current user's status using stored token
      const token = localStorage.getItem('pendingEmail');
      if (!token) {
        setStatus('PENDING');
        return;
      }
      const response = await apiClient.get(ENDPOINTS.AUTH.LOGIN.replace('/login', '/status') + `?email=${encodeURIComponent(token)}`);
      setStatus(response.data.status as AccountStatus);
      setRejectionReason(response.data.rejectionReason || '');
      setLastChecked(new Date());
    } catch {
      // If we can't fetch, default to PENDING (they came here from failed login)
      setStatus('PENDING');
      setLastChecked(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingEmail');
    if (storedEmail) setEmail(storedEmail);
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = status !== 'loading' && status !== 'error' ? cfg.icon : Clock;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden font-sans py-12">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl rounded-[32px] overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-4">

            <AnimatePresence mode="wait">
              {status === 'loading' ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mx-auto w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/10">
                  <Loader2 className="w-9 h-9 text-slate-400 animate-spin" />
                </motion.div>
              ) : (
                <motion.div key={status} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center border ${cfg.iconBg}`}>
                  <Icon className={`w-10 h-10 ${cfg.iconColor} ${status === 'PENDING' ? 'animate-pulse' : ''}`} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div key={status} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <CardTitle className="text-2xl font-black tracking-tight text-white">
                  {status === 'loading' ? 'Checking Status...' : cfg.title}
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium text-sm mt-2 px-4">
                  {status !== 'loading' && cfg.description}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <CardContent className="px-8 pb-4 space-y-4">

            {/* Rejection reason banner */}
            {status === 'REJECTED' && rejectionReason && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                <p className="font-bold text-xs uppercase tracking-widest text-red-500 mb-1">Reason</p>
                <p>{rejectionReason}</p>
              </motion.div>
            )}

            {/* Email indicator */}
            {email && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                <Mail className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <span className="truncate">{email}</span>
              </div>
            )}

            {/* Status steps for PENDING */}
            {status === 'PENDING' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
                {[
                  { label: 'Registration submitted', done: true },
                  { label: 'Admin review in progress', done: false, active: true },
                  { label: 'Account activation', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black
                      ${step.done ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        step.active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                        'bg-white/5 text-slate-600 border border-white/10'}`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-green-400' : step.active ? 'text-amber-300 font-medium' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Last checked */}
            {lastChecked && (
              <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </CardContent>

          <CardFooter className="pb-10 pt-4 px-8 flex flex-col gap-3">
            {status === 'APPROVED' ? (
              <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl">
                <Link to="/login"><CheckCircle2 className="w-5 h-5 mr-2" /> Go to Login</Link>
              </Button>
            ) : status === 'REJECTED' ? (
              <Button asChild className="w-full h-12 bg-white text-slate-950 hover:bg-slate-100 font-black rounded-2xl shadow-xl">
                <Link to="/register"><ArrowLeft className="w-5 h-5 mr-2" /> Register Again</Link>
              </Button>
            ) : (
              <Button
                onClick={fetchStatus}
                disabled={isRefreshing}
                variant="outline"
                className="w-full h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 font-black rounded-2xl"
              >
                {isRefreshing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Check Status</>
                )}
              </Button>
            )}
            <Button asChild variant="ghost" className="w-full h-10 text-slate-500 hover:text-white text-xs font-bold rounded-xl">
              <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Return to Login</Link>
            </Button>
            <a href="mailto:support@cargolink.com"
              className="flex items-center justify-center gap-2 text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-bold uppercase tracking-widest">
              <HelpCircle className="w-3 h-3" /> Contact Support
            </a>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
