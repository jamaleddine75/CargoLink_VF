import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Wallet, PagedResponse } from '../../types';

export interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  date: string;
}

export interface CustomerWalletStats {
  id: string;
  balance: number;
  totalCOD: number;
  totalFees: number;
  totalOrders: number;
  weeklyCOD: number;
  pendingCOD: number;
  availableBalance: number;
  loyaltyPoints?: number;
  pointsThisMonth?: number;
}

const customerWalletService = {
  /**
   * Fetch statistics for the customer (sender) wallet
   */
  getStats: async (): Promise<CustomerWalletStats> => {
    const response = await apiClient.get<CustomerWalletStats>(ENDPOINTS.WALLET.CUSTOMER_STATS);
    return response.data;
  },

  /**
   * Get current customer wallet balance
   */
  getBalance: async (): Promise<Wallet> => {
    const response = await apiClient.get<Wallet>(ENDPOINTS.WALLET.BALANCE);
    return response.data;
  },

  /**
   * Fetch paginated transactions for the customer
   */
  getTransactions: async (
    page = 0,
    size = 20,
    type?: string,
    period?: string
  ): Promise<PagedResponse<WalletTransaction>> => {
    const params: Record<string, string | number> = { page, size };
    if (type && type !== 'all') params.type = type;
    if (period && period !== 'all') params.period = period;
    
    const response = await apiClient.get<PagedResponse<WalletTransaction>>(ENDPOINTS.WALLET.TRANSACTIONS, { params });
    return response.data;
  },

  /**
   * Download transaction statement as CSV for the customer
   */
  downloadStatement: async (): Promise<void> => {
    const response = await apiClient.get(`${ENDPOINTS.WALLET.BASE}/statement/csv`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customer_wallet_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Request a withdrawal (e.g., from COD collection balance)
   */
  requestWithdrawal: async (data: { 
    amount: number; 
    paymentAccountId: string;
  }): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`${ENDPOINTS.WALLET.BASE}/withdrawal-request`, data);
    return response.data;
  }
};

export default customerWalletService;
