import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, RefreshCw, Clock, XCircle,
  CheckCircle2, Mail, HelpCircle, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'loading' | 'error';

interface StatusConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    icon: Clock,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-500',
    title: 'Account Under Review',
    description: 'Your registration is being reviewed by our team. This usually takes up to 24 hours.',
  },
  APPROVED: {
    icon: CheckCircle2,
    iconBg: 'bg-green-500/10 border-green-500/20',
    iconColor: 'text-green-500',
    title: 'Account Approved!',
    description: 'Your account has been approved. You can now log in and access the platform.',
  },
  REJECTED: {
    icon: XCircle,
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconColor: 'text-red-500',
    title: 'Application Rejected',
    description: 'Unfortunately, your application was not approved at this time.',
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
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = status !== 'loading' && status !== 'error' ? cfg.icon : Clock;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-12 font-sans relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-[440px] space-y-6"
      >
        {/* Status icon + title */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            {status === 'loading' ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mx-auto w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </motion.div>
            ) : (
              <motion.div key={status} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border mb-3 ${cfg.iconBg}`}>
                <Icon className={`w-6 h-6 ${cfg.iconColor} ${status === 'PENDING' ? 'animate-pulse' : ''}`} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div key={status} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {status === 'loading' ? 'Checking Status...' : cfg.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 px-4">
                {status !== 'loading' && cfg.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-5">
            {/* Rejection reason banner */}
            {status === 'REJECTED' && rejectionReason && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <p className="font-semibold text-xs text-red-500 mb-1">Reason</p>
                <p className="text-xs">{rejectionReason}</p>
              </motion.div>
            )}

            {/* Email indicator */}
            {email && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border text-muted-foreground text-xs">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}

            {/* Status steps for PENDING */}
            {status === 'PENDING' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
                {[
                  { label: 'Registration submitted', done: true },
                  { label: 'Admin review in progress', done: false, active: true },
                  { label: 'Account activation', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold border
                      ${step.done ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        step.active ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-muted text-muted-foreground border-border'}`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs ${
                      step.done ? 'text-green-600 dark:text-green-500 font-medium' :
                      step.active ? 'text-amber-600 dark:text-amber-500 font-medium' :
                      'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {status === 'APPROVED' ? (
                <Link to="/login" className="w-full">
                  <button className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Go to Login
                  </button>
                </Link>
              ) : status === 'REJECTED' ? (
                <Link to="/register" className="w-full">
                  <button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Register Again
                  </button>
                </Link>
              ) : (
                <button
                  onClick={fetchStatus}
                  disabled={isRefreshing}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isRefreshing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Refreshing...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Check Status</>
                  )}
                </button>
              )}
              
              <Link to="/login" className="w-full">
                <button className="w-full h-10 border border-border bg-background hover:bg-muted/50 text-foreground font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Return to Login
                </button>
              </Link>

              {lastChecked && (
                <p className="text-center text-[10px] text-muted-foreground font-medium">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}

              <a href="mailto:support@cargolink.com"
                className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-semibold uppercase tracking-wider pt-2">
                <HelpCircle className="w-3.5 h-3.5" /> Contact Support
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;

