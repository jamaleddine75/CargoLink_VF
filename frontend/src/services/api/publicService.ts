import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export const getAvailableCities = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>(ENDPOINTS.PUBLIC.AVAILABLE_CITIES);
  return response.data;
};


