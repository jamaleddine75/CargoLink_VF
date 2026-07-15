import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { AuthResponse, UserRole } from '../../types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  vehicleType?: string;
  licenseNumber?: string;
  documents?: string;
  companyName?: string;
  taxId?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  gender?: string;
  dateOfBirth?: string;
}


export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, userData);
  return response.data;
};

export const getCurrentUser = async (): Promise<unknown> => {
  const response = await apiClient.get(ENDPOINTS.AUTH.ME);
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pendingEmail');
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
  return response.data;
};

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  companyName?: string;
  taxId?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
}

export const updateProfile = async (data: UpdateProfileData): Promise<unknown> => {
  const response = await apiClient.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data);
  return response.data;
};

export interface UpdatePasswordData {
  oldPassword?: string;
  newPassword?: string;
}

export const updatePassword = async (data: UpdatePasswordData): Promise<unknown> => {
  const response = await apiClient.put(ENDPOINTS.AUTH.UPDATE_PASSWORD, data);
  return response.data;
};

export const updateAvatar = async (file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.put(ENDPOINTS.AUTH.UPDATE_AVATAR, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateAvatarUrl = async (avatarUrl: string): Promise<unknown> => {
  const response = await apiClient.put(ENDPOINTS.AUTH.UPDATE_AVATAR + '/url', { avatarUrl });
  return response.data;
};