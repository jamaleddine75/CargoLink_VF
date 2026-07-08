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
  userType: string;
  agencyName?: string;
  balance: number;
  availableBalance: number;
  reservedBalance: number;
  frozenBalance: number;
  pendingBalance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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

  getWallets: async (page = 0, size = 20): Promise<any> => {
    const response = await apiClient.get(ENDPOINTS.FINANCE_CENTER.WALLETS, { params: { page, size } });
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
  }
};
