import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Banknote, Receipt, Landmark, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { TRANSACTION_LABELS } from '@/lib/constants/walletConstants';

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date?: string;
  createdAt?: string;
  status: string;
}

interface TransactionListProps {
  transactions: WalletTransaction[];
  loading?: boolean;
}

const getTxConfig = (type: string, amount: number) => {
  const key = type.toUpperCase();
  const positive = amount >= 0;
  const label = TRANSACTION_LABELS[key] || key.replace(/_/g, ' ');

  switch (key) {
    case 'GAIN':
    case 'EARNING':
    case 'CREDIT':
    case 'BONUS':
    case 'DEPOSIT':
      return { icon: ArrowDownLeft, positive: true, textClass: 'text-emerald-600 dark:text-emerald-400', label };
    case 'DEDUCTION':
    case 'PAYOUT':
    case 'WITHDRAWAL':
    case 'WITHDRAW':
    case 'DELIVERY_PAYMENT':
      return { icon: ArrowUpRight, positive: false, textClass: 'text-rose-600 dark:text-rose-400', label };
    case 'COD_COLLECTION':
    case 'COD_COLLECTED':
      return { icon: Banknote, positive: true, textClass: 'text-blue-600 dark:text-blue-400', label };
    case 'COD_SETTLED':
      return { icon: Landmark, positive: true, textClass: 'text-emerald-600 dark:text-emerald-400', label };
    case 'REFUND':
      return { icon: RefreshCw, positive: true, textClass: 'text-amber-600 dark:text-amber-400', label };
    default:
      return {
        icon: positive ? ArrowDownLeft : ArrowUpRight,
        positive,
        textClass: positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
        label,
      };
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg border border-border" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card text-muted-foreground">
        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Aucune transaction trouvée</p>
      </div>
    );
  }

  return (
    <Card className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
      {transactions.map((tx) => {
        const config = getTxConfig(tx.type, tx.amount);
        const Icon = config.icon;
        const txDate = tx.date || tx.createdAt || new Date().toISOString();
        const amount = Math.abs(tx.amount || 0);

        return (
          <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">{tx.description || config.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(txDate).toLocaleDateString('fr-MA', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={`text-sm font-semibold ${config.textClass}`}>
                {config.positive ? '+' : ''}
                {amount.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
              </p>
              <StatusBadge status={tx.status} />
            </div>
          </div>
        );
      })}
    </Card>
  );
};

export default TransactionList;
