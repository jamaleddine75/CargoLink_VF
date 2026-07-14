export const MIN_WITHDRAWAL_AMOUNT = 200; // MAD

export const WALLET_STATUS_COLORS = {
  PENDING: 'amber',
  PROCESSING: 'blue',
  COMPLETED: 'emerald',
  CREDITED: 'emerald',
  CONFIRMED: 'emerald',
  FAILED: 'rose',
  REJECTED: 'rose',
  ACTIVE: 'emerald',
  FROZEN: 'rose',
} as const;

export const TRANSACTION_LABELS: Record<string, string> = {
  EARNING: 'Gain',
  GAIN: 'Gain',
  BONUS: 'Bonus',
  CREDIT: 'Crédit',
  DEPOSIT: 'Dépôt',
  COD_COLLECTION: 'COD collecté',
  COD_COLLECTED: 'COD collecté',
  CASH_KEPT_BY_DRIVER: 'Part gardée par le livreur',
  COD_REMIS: 'Remise COD',
  COD_SETTLED: 'COD remis',
  WITHDRAWAL: 'Retrait',
  WITHDRAW: 'Retrait',
  PAYOUT: 'Virement',
  DEDUCTION: 'Déduction',
  REFUND: 'Remboursement',
};
