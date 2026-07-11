import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Wallet, PagedResponse } from '../../types';

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'EARNING' | 'COD_COLLECTION' | 'WITHDRAWAL' | 'BONUS';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  createdAt: string;
  orderId?: string;
}

export interface DriverWalletStats {
  balance: number;
  cashInHand: number;
  debtToSystem: number;
  pendingCodTotal: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalDeliveries: number;
}

export interface PendingCodOrder {
  id: string;
  orderId: string;
  trackingNumber?: string;
  deliveryAddress?: string;
  amount: number;
  codAmount?: number;
  date?: string;
  status?: string;
  description?: string;
}

export interface DailyEarningsPoint {
  date: string;
  earnings: number;
  orderCount?: number;
}

const driverWalletService = {
  /**
   * Fetch solde + stats wallet
   */
  getBalance: async (): Promise<DriverWalletStats> => {
    const response = await apiClient.get<DriverWalletStats>(`${ENDPOINTS.WALLET.BASE}/balance`);
    return response.data;
  },

  /**
   * Historique transactions avec filtres
   */
  getTransactions: async (
    page = 0,
    size = 50,
    type: string = 'all',
    period: string = 'week'
  ): Promise<PagedResponse<WalletTransaction>> => {
    const params: unknown = { page, size, type, period };
    const response = await apiClient.get<PagedResponse<WalletTransaction>>(ENDPOINTS.WALLET.TRANSACTIONS, { params });
    return response.data;
  },

  /**
   * Liste des COD en attente de remise
   */
  getPendingCod: async (): Promise<PendingCodOrder[]> => {
    const response = await apiClient.get<PendingCodOrder[]>(`${ENDPOINTS.WALLET.BASE}/pending-cod`);
    return response.data;
  },

  /**
   * Déclarer remise COD
   */
  declareCodRemittance: async (orderIds: string[], totalAmount: number): Promise<unknown> => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.WALLET.BASE}/cod-remittance`, { orderIds, totalAmount });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Fallback for standard error
      }
      // Check if it's an axios-like error with a response
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response: { data: unknown } };
        console.error("Backend Error Response (Full):", JSON.stringify(err.response.data, null, 2));
      }
      throw error;
    }
  },

  /**
   * Remise immédiate par scan QR (ID Agence)
   */
  remitByScan: async (agencyId: string): Promise<unknown> => {
    const response = await apiClient.post(`${ENDPOINTS.WALLET.BASE}/remit/scan`, { agencyId });
    return response.data;
  },

  /**
   * Demander un retrait
   */
  requestWithdrawal: async (data: { amount: number; paymentAccountId: string }): Promise<unknown> => {
    // The spec says POST /api/wallets/withdraw
    const response = await apiClient.post(`${ENDPOINTS.WALLET.BASE}/withdraw`, data);
    return response.data;
  },

  /**
   * Commission hebdomadaire
   */
  getWeeklyCommission: async (): Promise<unknown> => {
    const response = await apiClient.get(`${ENDPOINTS.WALLET.BASE}/commission/weekly`);
    return response.data;
  },

  /**
   * Gains mensuels
   */
  getMonthlyEarnings: async (): Promise<unknown> => {
    const response = await apiClient.get(`${ENDPOINTS.WALLET.BASE}/earnings/monthly`);
    return response.data;
  },

  /**
   * Daily earnings for chart
   */
  getDailyEarnings: async (days = 7): Promise<DailyEarningsPoint[]> => {
    const response = await apiClient.get<DailyEarningsPoint[]>(`${ENDPOINTS.WALLET.BASE}/daily-earnings`, {
      params: { days }
    });
    return response.data;
  },

  /**
   * Export statement as CSV
   */
  exportStatementCsv: async (): Promise<void> => {
    const response = await apiClient.get(`${ENDPOINTS.WALLET.BASE}/statement/csv`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default driverWalletService;
