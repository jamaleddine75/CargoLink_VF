export const TRANSACTION_LABELS = {
  GAIN_LIVRAISON: 'Livraison',
  GAIN_RAMASSAGE: 'Ramassage',
  GAIN_RETOUR: 'Retour',
  BONUS_PERFORMANCE: 'Bonus Performance',
  BONUS_WEEKEND: 'Bonus Week-end',
  BONUS_WEEK_END: 'Bonus Week-end',
  COD_COLLECTE: 'Collecte COD',
  COD_REMIS: 'Remise COD',
  PAIEMENT: 'Virement',
  DEDUCTION_INCIDENT: 'Déduction Incident',
  DEDUCTION_MATERIEL: 'Déduction Matériel',
  DEDUCTION_EQUIPEMENT: 'Déduction Équipement',
  AVANCE: 'Avance',
  PÉNALITÉ: 'Pénalité',
};

export const TRANSACTION_TYPES = {
  GAINS: ['GAIN_LIVRAISON', 'GAIN_RAMASSAGE', 'GAIN_RETOUR', 'BONUS_PERFORMANCE', 'BONUS_WEEKEND', 'BONUS_WEEK_END'],
  COD: ['COD_COLLECTE', 'COD_REMIS'],
  DEDUCTIONS: ['DEDUCTION_INCIDENT', 'AVANCE', 'PAIEMENT', 'DEDUCTION_MATERIEL', 'PÉNALITÉ', 'DEDUCTION_EQUIPEMENT'],
};

export const REMITTANCE_METHODS = {
  CASH: 'Dépôt Agence',
  TRANSFER: 'Virement Bancaire',
};

export const PAYOUT_METHODS = {
  CIH: 'Bank CIH',
  Wafacash: 'Wafacash',
  CashPlus: 'CashPlus',
};
