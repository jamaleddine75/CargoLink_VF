import apiClient from '../../api/client';

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface SavedAddressRequest {
  label: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

const addressService = {
  getSavedAddresses: async (): Promise<SavedAddress[]> => {
    const response = await apiClient.get<SavedAddress[]>('/address-book');
    return response.data;
  },

  saveAddress: async (request: SavedAddressRequest): Promise<SavedAddress> => {
    const response = await apiClient.post<SavedAddress>('/address-book', request);
    return response.data;
  },

  updateAddress: async (id: string, request: SavedAddressRequest): Promise<SavedAddress> => {
    const response = await apiClient.put<SavedAddress>(`/address-book/${id}`, request);
    return response.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/address-book/${id}`);
  }
};

export default addressService;
