import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

export interface FinancialSummaryDTO {
  platformBalance: number;
  availableBalance: number;
  reservedBalance: number;
  totalWalletBalance: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalRevenue: number;
  platformProfit: number;
  netProfit: number;
  platformExpenses: number;
  pendingWithdrawalsAmount: number;
  pendingDepositsAmount: number;
  codPendingAmount: number;
  codCollectedAmount: number;
  activeWalletsCount: number;
  frozenWalletsCount: number;
  activeAgenciesCount: number;
  activeDriversCount: number;
}

export interface WalletOverviewDTO {
  walletId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  userType: string;
  agencyName?: string;
  balance: number;
  availableBalance: number;
  reservedBalance: number;
  frozenBalance: number;
  pendingBalance: number;
  cashInHand?: number;
  debtToSystem?: number;
  isFrozen?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSettingsDTO {
  id: string;
  platformFeeRate: number;
  defaultAgencyCommissionRate: number;
  clientSettlementFormula: 'COD_MINUS_FEE' | 'COD_FULL';
  autoReconcileDailyBatch: boolean;
  debtAlertThreshold: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface TransactionDTO {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  walletId: string;
  ownerName: string;
  ownerRole: string;
  createdAt: string;
}

export interface AnalyticsDTO {
  topAgencies: any[];
  topDrivers: any[];
  topCustomers: any[];
  mostActiveWallets: any[];
  highestRevenue: number;
  lowestRevenue: number;
  profitMargin: number;
  monthlyGrowth: number;
  netProfit: number;
}

export const financialService = {
  getOverviewKPIs: async (): Promise<FinancialSummaryDTO> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.OVERVIEW);
    return response.data;
  },

  getAnalyticsSummary: async (): Promise<AnalyticsDTO> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.ANALYTICS);
    return response.data;
  },

  getFinanceSettings: async (): Promise<FinanceSettingsDTO> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.SETTINGS);
    return response.data;
  },

  updateFinanceSettings: async (payload: Partial<FinanceSettingsDTO>): Promise<FinanceSettingsDTO> => {
    const response = await apiClient.put(ENDPOINTS.FINANCE_CENTER.SETTINGS, payload);
    return response.data;
  },

  getWallets: async (page = 0, size = 20, walletType?: string, status?: string, search?: string): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.WALLETS, { params: { page, size, walletType, status, search } });
    return response.data;
  },

  freezeWallet: async (id: string, reason: string): Promise<any> => {
    const response = await apiClient.put(ENDPOINTS.FINANCE_CENTER.FREEZE(id), null, { params: { reason } });
    return response.data;
  },

  unfreezeWallet: async (id: string, reason: string): Promise<any> => {
    const response = await apiClient.put(ENDPOINTS.FINANCE_CENTER.UNFREEZE(id), null, { params: { reason } });
    return response.data;
  },

  adjustWalletBalance: async (id: string, amount: number, direction: 'CREDIT' | 'DEBIT', reason: string): Promise<any> => {
    const response = await apiClient.post(ENDPOINTS.FINANCE_CENTER.ADJUST_BALANCE(id), { amount, direction, reason });
    return response.data;
  },

  getTransactions: async (page = 0, size = 20, type?: string, status?: string): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.TRANSACTIONS, {
      params: { page, size, type, status }
    });
    return response.data;
  },

  getWithdrawals: async (page = 0, size = 20, status?: string): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.WITHDRAWALS, {
      params: { page, size, status }
    });
    return response.data;
  },

  getAuditLogs: async (page = 0, size = 20, action?: string, actor?: string): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.AUDIT_LOGS, {
      params: { page, size, action, actor }
    });
    return response.data;
  },

  runManualSettlement: async (scheduleType = 'MANUAL'): Promise<any> => {
    const response = await apiClient.post('/admin/finance/settle', null, { params: { scheduleType } });
    return response.data;
  },

  runManualReconciliation: async (): Promise<any> => {
    const response = await apiClient.post('/admin/finance/reconcile');
    return response.data;
  },

  runFraudScan: async (): Promise<any> => {
    const response = await apiClient.post('/admin/finance/fraud-scan');
    return response.data;
  },

  getFraudAlerts: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/finance/fraud-alerts');
    return response.data;
  },

  getReconciliations: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/finance/reconciliations');
    return response.data;
  },

  getLedgerAccounts: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/finance/ledger-accounts');
    return response.data;
  },

  getJournalEntries: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/finance/journal-entries');
    return response.data;
  },

  approveWithdrawal: async (id: string): Promise<any> => {
    const response = await apiClient.put(`/admin/finance/withdrawals/${id}/approve`);
    return response.data;
  },

  rejectWithdrawal: async (id: string, reason: string): Promise<any> => {
    const response = await apiClient.put(`/admin/finance/withdrawals/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },

  exportFinanceData: async (type: string, startDate?: string, endDate?: string, status?: string): Promise<Blob> => {
    const response = await apiClient.post('/admin/finance/export', null, {
      params: { type, startDate, endDate, status },
      responseType: 'blob'
    });
    return response.data;
  }
};
