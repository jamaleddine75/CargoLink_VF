import apiClient from '../../api/client';

export interface PaymentAccountResponse {
  id: string;
  provider: string;
  accountIdentifier: string;
  verified: boolean;
  verifiedAt: string;
  isDefault: boolean;
  preferredCurrency: string;
  status: string;
}

export const paymentAccountService = {
  getMyPaymentAccounts: async (): Promise<PaymentAccountResponse[]> => {
    const response = await apiClient.get('/payment-accounts');
    return response.data;
  },
  createPaymentAccount: async (data: { provider: string, accountIdentifier: string, isDefault: boolean, preferredCurrency?: string }): Promise<PaymentAccountResponse> => {
    const response = await apiClient.post('/payment-accounts', data);
    return response.data;
  },
};
