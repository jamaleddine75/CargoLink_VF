import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

const GET_ENDPOINTS = (agencyId: string) => ENDPOINTS.AGENCIES.CUSTOMERS;

export interface AgencyCustomer {
  id: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  city?: string;
  address?: string;
  notes?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  totalOrders: number;
  totalRevenue: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
  isVip: boolean;
  isHighRisk: boolean;
}

export interface AgencyCustomerRequest {
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  city?: string;
  address?: string;
  notes?: string;
}

export const agencyCustomerService = {
  getCustomers: async (agencyId: string, query?: string, page = 0, size = 10) => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.CUSTOMERS.BASE(agencyId), {
      params: { query, page, size }
    });
    return response.data;
  },

  getCustomer: async (agencyId: string, customerId: string) => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.CUSTOMERS.BY_ID(agencyId, customerId));
    return response.data;
  },

  createCustomer: async (agencyId: string, data: AgencyCustomerRequest) => {
    const response = await apiClient.post(ENDPOINTS.AGENCIES.CUSTOMERS.BASE(agencyId), data);
    return response.data;
  },

  updateCustomer: async (agencyId: string, customerId: string, data: AgencyCustomerRequest) => {
    const response = await apiClient.put(ENDPOINTS.AGENCIES.CUSTOMERS.BY_ID(agencyId, customerId), data);
    return response.data;
  },

  suspendCustomer: async (agencyId: string, customerId: string) => {
    await apiClient.patch(ENDPOINTS.AGENCIES.CUSTOMERS.ACTION(agencyId, customerId, 'suspend'));
  },

  blockCustomer: async (agencyId: string, customerId: string) => {
    await apiClient.patch(ENDPOINTS.AGENCIES.CUSTOMERS.ACTION(agencyId, customerId, 'block'));
  },

  activateCustomer: async (agencyId: string, customerId: string) => {
    await apiClient.patch(ENDPOINTS.AGENCIES.CUSTOMERS.ACTION(agencyId, customerId, 'activate'));
  },

  deleteCustomer: async (agencyId: string, customerId: string) => {
    await apiClient.delete(ENDPOINTS.AGENCIES.CUSTOMERS.BY_ID(agencyId, customerId));
  },

  getAnalytics: async (agencyId: string) => {
    const response = await apiClient.get(ENDPOINTS.AGENCIES.CUSTOMERS.ANALYTICS(agencyId));
    return response.data;
  }
};
