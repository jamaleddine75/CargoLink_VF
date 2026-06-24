import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { AgencySettings, ApiResponse } from '../types';

/**
 * Service for Agency-specific operations
 */
export const agencyService = {
  /**
   * Get the current agency profile
   */
  getProfile: async (): Promise<AgencySettings> => {
    const response = await apiClient.get<ApiResponse<AgencySettings>>(ENDPOINTS.AGENCY_ADMIN.PROFILE);
    return response.data.data!;
  },

  /**
   * Update the agency profile
   */
  updateProfile: async (data: Partial<AgencySettings>): Promise<AgencySettings> => {
    const response = await apiClient.put<ApiResponse<AgencySettings>>(ENDPOINTS.AGENCY_ADMIN.UPDATE_PROFILE, data);
    return response.data.data!;
  },

  /**
   * Upload agency logo
   */
  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      ENDPOINTS.AGENCY_ADMIN.UPLOAD_LOGO, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!.url;
  },
};
