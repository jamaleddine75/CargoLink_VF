import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, User, ShieldCheck, Loader2, AlertCircle, CheckCircle2, XCircle, Wallet, Clock, ArrowUpRight, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';

export interface WithdrawalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  paypalAccount: { id: string; accountIdentifier: string; status: string } | null;
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
  blockedReason?: string;
}

export function WithdrawalModal({
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
  onReset,
  blockedReason
}: WithdrawalModalProps) {
  const exchangeRate = 10.0; 
  
  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const estimatedUsd = (parsedAmount / exchangeRate).toFixed(2);

  const finalAmount = successData?.amount ? parseFloat(successData.amount) : parsedAmount;
  const finalUsd = (finalAmount / exchangeRate).toFixed(2);
  const txId = successData?.id || 'En attente...';
  const txDate = successData?.createdAt ? new Date(successData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const txStatus = successData?.status || 'COMPLETED';
  const txEmail = successData?.paypalEmail || paypalAccount?.accountIdentifier;

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
      <DialogContent className="bg-background border border-border rounded-lg p-0 overflow-hidden w-[95vw] max-w-[900px] max-h-[90vh] shadow-lg flex flex-col">
        <DialogTitle className="sr-only">Retrait via PayPal</DialogTitle>
        
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleOpenChange(false)} 
            disabled={isSubmitting} 
            className="w-8 h-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Demande de Retrait Transmise</h3>
              <p className="text-muted-foreground text-sm font-medium">Vos fonds sont en cours de transfert sécurisé.</p>
            </div>

            <div className="w-full max-w-md bg-muted rounded-xl p-6 space-y-3 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Montant</span>
                <div className="text-right">
                  <span className="text-foreground font-semibold">{finalAmount.toFixed(2)} MAD</span>
                  <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-0.5">≈ {finalUsd} USD</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Destination</span>
                <span className="text-foreground font-semibold truncate max-w-[200px]">{txEmail}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">ID Transaction</span>
                <span className="text-foreground font-semibold text-xs truncate max-w-[200px]">{txId}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Date</span>
                <span className="text-foreground font-semibold">{txDate}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Statut</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{txStatus}</span>
              </div>
            </div>

            <Button 
              onClick={() => handleOpenChange(false)} 
              className="w-full max-w-md h-12 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
            >
              Terminer
            </Button>
          </div>
        ) : isError ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Échec du Retrait</h3>
              <p className="text-rose-500 text-sm font-medium">{errorMessage || 'Une erreur inattendue est survenue.'}</p>
            </div>
            <div className="flex w-full max-w-md gap-3 pt-2">
              <Button 
                onClick={() => handleOpenChange(false)} 
                variant="outline"
                className="flex-1 h-12 rounded-lg font-medium text-sm"
              >
                Fermer
              </Button>
              <Button 
                onClick={onReset} 
                className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm"
              >
                Réessayer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] h-full">
            
            {/* LEFT SIDEBAR */}
            <div className="bg-muted border-r border-border p-6 flex flex-col gap-6">
              {/* Available Balance Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex flex-col gap-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Wallet size={48} className="text-primary" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">Solde Disponible</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {(availableBalance || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-muted-foreground">MAD</span>
                </p>
              </div>

              {/* PayPal Account Card */}
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Compte Connecté</p>
                    {paymentAccountsLoading ? (
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    ) : paypalAccount ? (
                      <p className="text-xs font-bold text-foreground truncate leading-tight">{paypalAccount.accountIdentifier}</p>
                    ) : (
                      <p className="text-xs font-bold text-muted-foreground">Aucun</p>
                    )}
                  </div>
                </div>
                
                {paypalAccount && (
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none text-[8px] font-bold uppercase tracking-widest px-2 py-0.5">
                      Vérifié
                    </Badge>
                    <button 
                      type="button"
                      onClick={() => { setIsConnectingPaypal(true); }}
                      className="text-[10px] text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>

              {/* Estimated Arrival */}
              <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                  <Clock size={16} className="text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Délai estimé</p>
                  <p className="text-xs font-bold text-foreground">Quelques minutes</p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-auto bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-medium text-left">
                  Sécurisé par le traitement des paiements PayPal.
                </p>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="p-6 md:p-8 flex flex-col h-full text-left">
              {blockedReason ? (
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-500">Retrait Bloqué</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{blockedReason}</p>
                    </div>
                  </div>
                </div>
              ) : paymentAccountsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
              ) : !paypalAccount ? (
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM15.441 5.918c-.023-.143-.047-.288-.077-.437C15.012 3.82 14.7 2.65 13.79 1.6 12.788.434 10.98 0 8.618 0H1.631a.641.641 0 0 0-.633.74L4.1 20.43c.082.518.53.9 1.054.9h4.606l1.12-7.106c.082-.518.53-.9 1.054-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437z"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Retrait via PayPal</h3>
                    <p className="text-muted-foreground text-sm">Associez un compte PayPal vérifié pour recevoir vos fonds instantanément.</p>
                  </div>

                  {isConnectingPaypal ? (
                    <form onSubmit={onConnectPaypal} className="space-y-4 bg-muted p-6 rounded-lg border border-border shadow-sm">
                      <div className="space-y-2 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground">E-mail PayPal</Label>
                        <Input
                          type="email"
                          value={paypalEmail}
                          onChange={e => setPaypalEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          disabled={isSubmitting}
                          className="h-11 bg-background border-border text-foreground focus-visible:ring-primary rounded-lg"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => { setIsConnectingPaypal(false); setPaypalEmail(''); }}
                          disabled={isSubmitting}
                          className="flex-1 h-11 rounded-lg text-xs font-medium"
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isSubmitting || !paypalEmail}
                          className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connecter'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button 
                      onClick={() => setIsConnectingPaypal(true)} 
                      className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
                    >
                      Connecter mon compte PayPal
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={onWithdraw} className="flex flex-col h-full max-w-2xl mx-auto w-full">
                  
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">Retrait via PayPal</h2>
                    <p className="text-muted-foreground text-xs font-medium">Transférez votre solde disponible en toute sécurité vers votre compte PayPal.</p>
                  </div>

                  <div className="flex-1 space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                        Montant du retrait (Min: {MIN_WITHDRAWAL_AMOUNT} MAD)
                        <Tooltip>
                          <TooltipTrigger type="button" className="cursor-help">
                            <Info size={12} className="text-muted-foreground/60 hover:text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                            Votre demande de retrait sera soumise à l'administrateur qui validera le transfert PayPal. 
                            Le montant est déduit immédiatement de votre solde disponible. 
                            Une fois approuvé, les fonds arrivent sous quelques minutes sur votre compte PayPal.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="relative group flex items-center">
                        <span className="absolute left-4 text-lg font-bold text-muted-foreground/50 transition-colors group-focus-within:text-primary">MAD</span>
                        <Input
                          type="number"
                          step="0.01"
                          min={MIN_WITHDRAWAL_AMOUNT}
                          max={availableBalance}
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          disabled={isSubmitting}
                          className="h-[64px] pl-[64px] pr-4 rounded-lg bg-muted border-border font-bold text-2xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          required
                        />
                        <div className="absolute right-4 flex items-center h-full">
                           <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                             &asymp; {estimatedUsd} USD
                           </div>
                        </div>
                      </div>
                      
                      {/* Quick Amount Pills */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[200, 500, 1000, 2000, 'MAX'].map(val => {
                          const amountStr = val === 'MAX' ? String(availableBalance || 0) : String(val);
                          const isSelected = withdrawAmount === amountStr && amountStr !== '0';
                          const isDisabled = isSubmitting || (val !== 'MAX' && (availableBalance || 0) < Number(val));
                          
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setWithdrawAmount(amountStr)}
                              className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                  : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                                isDisabled && "opacity-30 cursor-not-allowed hover:bg-background"
                              )}
                            >
                              {val === 'MAX' ? 'MAX' : `${val}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-muted rounded-lg p-5 space-y-3 border border-border">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Montant du retrait</span>
                        <span className="text-foreground font-semibold">{parsedAmount ? parsedAmount.toFixed(2) : '0.00'} MAD</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Taux de change</span>
                        <span className="text-muted-foreground font-semibold">1 USD = {exchangeRate} MAD</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Montant crédité (USD)</span>
                        <span className="text-primary font-bold">{estimatedUsd} USD</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-muted-foreground font-medium">Frais plateforme</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.00 MAD</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !parsedAmount || parsedAmount < MIN_WITHDRAWAL_AMOUNT}
                      className={cn(
                        "w-full h-12 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2",
                        (!parsedAmount || parsedAmount < MIN_WITHDRAWAL_AMOUNT)
                          ? "bg-muted text-muted-foreground border border-border cursor-not-allowed" 
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                      ) : (
                        <>Valider le Retrait <ArrowUpRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  </div>
                  
                </form>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WithdrawalModal;
