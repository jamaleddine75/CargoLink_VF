import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, User, ShieldCheck, Loader2, AlertCircle, CheckCircle2, XCircle, Wallet, Clock, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PayPalWithdrawalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  paypalAccount: any | null;
  paymentAccountsLoading: boolean;
  isConnectingPaypal: boolean;
  setIsConnectingPaypal: (val: boolean) => void;
  paypalEmail: string;
  setPaypalEmail: (email: string) => void;
  onConnectPaypal: (e: React.FormEvent) => void;
  
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  onWithdraw: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  successData?: any;
  onReset: () => void;
}

export function PayPalWithdrawalModal({
  isOpen,
  onOpenChange,
  availableBalance,
  paypalAccount,
  paymentAccountsLoading,
  isConnectingPaypal,
  setIsConnectingPaypal,
  paypalEmail,
  setPaypalEmail,
  onConnectPaypal,
  withdrawAmount,
  setWithdrawAmount,
  onWithdraw,
  isSubmitting,
  isSuccess,
  isError,
  errorMessage,
  successData,
  onReset
}: PayPalWithdrawalModalProps) {
  const exchangeRate = 10.0; 
  
  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const estimatedUsd = (parsedAmount / exchangeRate).toFixed(2);

  // Use backend response as the single source of truth for success screen
  const finalAmount = successData?.amount ? parseFloat(successData.amount) : parsedAmount;
  const finalUsd = (finalAmount / exchangeRate).toFixed(2);
  const txId = successData?.id || 'Pending...';
  const txDate = successData?.createdAt ? new Date(successData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const txStatus = successData?.status || 'COMPLETED';
  const txEmail = successData?.paypalEmail || paypalAccount?.accountIdentifier;

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) {
        onReset();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0B0F17] border-white/5 rounded-[24px] p-0 overflow-hidden w-[95vw] max-w-[1050px] max-h-[90vh] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] sm:zoom-in-95 flex flex-col">
        <DialogTitle className="sr-only">Withdraw to PayPal</DialogTitle>
        
        {/* Floating Close Button */}
        <div className="absolute top-6 right-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleOpenChange(false)} 
            disabled={isSubmitting} 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md"
          >
            <X size={20} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-32 h-32 rounded-full bg-[#12D18E]/10 flex items-center justify-center relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-[#12D18E]/20 blur-2xl"
                />
                <CheckCircle2 className="w-16 h-16 text-[#12D18E] relative z-10" />
              </motion.div>
              
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-white">Withdrawal Submitted</h3>
                <p className="text-white/50 text-lg font-medium">Your funds are securely on the way.</p>
              </div>

              <div className="w-full max-w-lg bg-[#111827] rounded-3xl p-6 space-y-5 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Amount</span>
                  <div className="text-right">
                    <span className="text-white font-black text-xl">{finalAmount.toFixed(2)} MAD</span>
                    <p className="text-[#12D18E] text-xs font-bold mt-1">≈ {finalUsd} USD</p>
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Destination</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{txEmail}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Transaction ID</span>
                  <span className="text-white font-bold text-xs truncate max-w-[200px]">{txId}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Date</span>
                  <span className="text-white font-bold text-sm">{txDate}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Status</span>
                  <span className="text-[#12D18E] font-bold text-sm uppercase">{txStatus}</span>
                </div>
              </div>

              <Button 
                onClick={() => handleOpenChange(false)} 
                className="w-full max-w-lg h-16 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all text-lg"
              >
                Done
              </Button>
            </motion.div>
          ) : isError ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]"
            >
              <div className="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-16 h-16 text-rose-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-white">Withdrawal Failed</h3>
                <p className="text-rose-400 text-lg font-medium">{errorMessage || 'An unexpected error occurred.'}</p>
              </div>
              <div className="flex w-full max-w-lg gap-4 pt-4">
                <Button 
                  onClick={() => handleOpenChange(false)} 
                  variant="ghost"
                  className="flex-1 h-16 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-lg"
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={onReset} 
                  className="flex-1 h-16 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-500/20"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col md:grid md:grid-cols-[360px_1fr] h-full overflow-y-auto"
            >
              
              {/* LEFT SIDEBAR */}
              <div className="bg-[#111827] border-r border-white/5 p-8 flex flex-col gap-6">
                
                {/* Available Balance Card */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#2388FF]/10 to-transparent border border-[#2388FF]/20 rounded-[20px] p-6 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Wallet size={64} className="text-[#2388FF]" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2388FF]/70">Available Balance</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {(availableBalance || 0).toLocaleString()} <span className="text-lg text-white/50">MAD</span>
                  </p>
                </motion.div>

                {/* PayPal Account Card */}
                <motion.div variants={itemVariants} className="bg-[#111827] border border-white/5 shadow-lg rounded-[20px] p-5 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0B0F17] flex items-center justify-center shrink-0 border border-white/5">
                      <User size={20} className="text-white/50" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Connected Account</p>
                      {paymentAccountsLoading ? (
                        <div className="h-5 w-24 bg-white/10 animate-pulse rounded" />
                      ) : paypalAccount ? (
                        <p className="text-sm font-bold text-white truncate leading-tight">{paypalAccount.accountIdentifier}</p>
                      ) : (
                        <p className="text-sm font-bold text-white/50">None</p>
                      )}
                    </div>
                  </div>
                  
                  {paypalAccount && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <Badge className="bg-[#12D18E]/10 text-[#12D18E] hover:bg-[#12D18E]/20 border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest">
                        Verified
                      </Badge>
                      <button 
                        type="button"
                        onClick={() => { setIsConnectingPaypal(true); }}
                        className="text-xs text-[#2388FF] hover:text-[#2388FF]/80 font-bold uppercase tracking-wider transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Estimated Arrival */}
                <motion.div variants={itemVariants} className="bg-[#111827] border border-white/5 shadow-lg rounded-[20px] p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-[#0B0F17] flex items-center justify-center shrink-0 border border-white/5">
                    <Clock size={20} className="text-white/50" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Estimated Arrival</p>
                    <p className="text-sm font-bold text-white">Within minutes</p>
                  </div>
                </motion.div>

                {/* Security Notice */}
                <motion.div variants={itemVariants} className="mt-auto bg-[#12D18E]/5 border border-[#12D18E]/10 shadow-lg rounded-[20px] p-5 flex items-start gap-4 hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-[#12D18E]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={20} className="text-[#12D18E]" />
                  </div>
                  <p className="text-sm text-[#12D18E]/90 leading-relaxed font-medium">
                    Protected by encrypted PayPal payout processing.
                  </p>
                </motion.div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="p-8 md:p-12 flex flex-col h-full">
                
                {paymentAccountsLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-[#2388FF] w-12 h-12" />
                  </div>
                ) : !paypalAccount ? (
                  <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-[#2388FF]/10 rounded-2xl flex items-center justify-center mb-6 text-[#2388FF]">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM15.441 5.918c-.023-.143-.047-.288-.077-.437C15.012 3.82 14.7 2.65 13.79 1.6 12.788.434 10.98 0 8.618 0H1.631a.641.641 0 0 0-.633.74L4.1 20.43c.082.518.53.9 1.054.9h4.606l1.12-7.106c.082-.518.53-.9 1.054-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437z"/></svg>
                      </div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Withdraw to PayPal</h3>
                      <p className="text-white/50 text-base font-medium">Link a verified account to receive your funds instantly.</p>
                    </div>

                    {isConnectingPaypal ? (
                      <motion.form 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={onConnectPaypal}
                        className="space-y-6 bg-[#111827] p-8 rounded-[24px] border border-white/5 shadow-2xl"
                      >
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider text-white/50">PayPal Email</Label>
                          <Input
                            type="email"
                            value={paypalEmail}
                            onChange={e => setPaypalEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            disabled={isSubmitting}
                            className="h-16 bg-[#0B0F17] border-white/10 text-white text-lg placeholder:text-white/20 focus-visible:ring-[#2388FF] rounded-xl font-medium px-6"
                          />
                        </div>
                        <div className="flex gap-4 pt-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setIsConnectingPaypal(false); setPaypalEmail(''); }}
                            disabled={isSubmitting}
                            className="flex-1 h-16 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold text-lg"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={isSubmitting || !paypalEmail}
                            className="flex-1 h-16 bg-[#2388FF] hover:bg-[#2388FF]/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-[#2388FF]/20"
                          >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Connect'}
                          </Button>
                        </div>
                      </motion.form>
                    ) : (
                      <Button 
                        onClick={() => setIsConnectingPaypal(true)} 
                        className="w-full h-16 bg-[#2388FF] hover:bg-[#2388FF]/90 text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#2388FF]/20 transition-all hover:-translate-y-1"
                      >
                        Connect PayPal
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={onWithdraw} className="flex flex-col h-full max-w-2xl mx-auto w-full">
                    
                    <motion.div variants={itemVariants} className="mb-10">
                      <h2 className="text-3xl font-black text-white tracking-tight mb-2">Withdraw to PayPal</h2>
                      <p className="text-white/50 text-base font-medium">Transfer your available balance securely to your verified PayPal account.</p>
                    </motion.div>

                    <div className="flex-1 space-y-10">
                      {/* Amount Input */}
                      <motion.div variants={itemVariants} className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">Withdraw Amount</Label>
                        <div className="relative group flex items-center">
                          <span className="absolute left-6 text-2xl font-black text-white/40 transition-colors group-focus-within:text-[#2388FF]">MAD</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="200"
                            max={availableBalance}
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            disabled={isSubmitting}
                            className="h-[88px] pl-[100px] pr-6 rounded-[24px] bg-[#111827] border-white/5 focus-visible:bg-[#111827] focus-visible:border-[#2388FF]/50 font-black text-[52px] leading-none text-white placeholder:text-white/10 focus-visible:ring-4 focus-visible:ring-[#2388FF]/10 transition-all shadow-inner"
                            required
                          />
                          <div className="absolute right-6 flex items-center h-full">
                             <div className="text-xl font-bold text-[#2388FF] bg-[#2388FF]/10 px-4 py-2 rounded-xl border border-[#2388FF]/20 backdrop-blur-sm">
                               &asymp; {estimatedUsd} USD
                             </div>
                          </div>
                        </div>
                        
                        {/* Quick Amount Pills */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          {[200, 500, 1000, 2000, 'MAX'].map(val => {
                            const amountStr = val === 'MAX' ? String(availableBalance || 0) : String(val);
                            const isSelected = withdrawAmount === amountStr && amountStr !== '0';
                            const isDisabled = isSubmitting || (val !== 'MAX' && (availableBalance || 0) < Number(val));
                            
                            return (
                              <motion.button
                                whileHover={!isDisabled ? { y: -2 } : {}}
                                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                                key={val}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setWithdrawAmount(amountStr)}
                                className={cn(
                                  "px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
                                  isSelected 
                                    ? "bg-gradient-to-b from-[#2388FF] to-[#1a6bcf] border-[#2388FF] text-white shadow-lg shadow-[#2388FF]/20" 
                                    : "bg-[#111827] border-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                                  isDisabled && "opacity-30 cursor-not-allowed hover:bg-[#111827]"
                                )}
                              >
                                {val === 'MAX' ? 'MAX' : `${val}`}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* Summary Card */}
                      <motion.div variants={itemVariants} className="bg-[#111827] rounded-[24px] p-6 space-y-4 border border-white/5 shadow-xl">
                        <div className="flex justify-between items-center text-[15px]">
                          <span className="text-white/50 font-medium">Withdraw Amount</span>
                          <span className="text-white font-bold">{parsedAmount ? parsedAmount.toFixed(2) : '0.00'} MAD</span>
                        </div>
                        <div className="flex justify-between items-center text-[15px]">
                          <span className="text-white/50 font-medium">Exchange Rate</span>
                          <span className="text-white/70 font-bold">1 USD = {exchangeRate} MAD</span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-center text-[17px]">
                          <span className="text-white/50 font-medium">PayPal Amount</span>
                          <span className="text-[#2388FF] font-black">{estimatedUsd} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-[15px] pt-2">
                          <span className="text-white/50 font-medium">Platform Fee</span>
                          <span className="text-[#12D18E] font-bold">0.00 MAD</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Primary Button */}
                    <motion.div variants={itemVariants} className="mt-10">
                      <motion.button
                        whileHover={!isSubmitting && withdrawAmount ? { y: -3, boxShadow: "0 20px 40px -15px rgba(35,136,255,0.4)" } : {}}
                        whileTap={!isSubmitting && withdrawAmount ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={isSubmitting || !parsedAmount}
                        className={cn(
                          "w-full h-[64px] rounded-[20px] font-black text-[15px] uppercase tracking-wider transition-all relative overflow-hidden flex items-center justify-center gap-3",
                          !parsedAmount 
                            ? "bg-[#111827] text-white/30 border border-white/5 cursor-not-allowed" 
                            : "bg-gradient-to-r from-[#2388FF] to-[#1a6bcf] text-white shadow-xl shadow-[#2388FF]/20 border border-[#2388FF]/50"
                        )}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                        ) : (
                          <>Withdraw to PayPal <ArrowUpRight className="w-5 h-5" /></>
                        )}
                      </motion.button>
                    </motion.div>
                    
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
