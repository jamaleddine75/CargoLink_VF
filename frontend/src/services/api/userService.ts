import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { User } from '../../types';

const userService = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>(ENDPOINTS.USERS.ME);
    return response.data;
  },

  updateAvatar: async (avatarUrl: string): Promise<User> => {
    const response = await apiClient.put<User>(ENDPOINTS.USERS.UPDATE_AVATAR, { avatarUrl });
    return response.data;
  }
};

export default userService;
