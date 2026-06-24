import apiClient from '../api/client';
import { User, PagedResponse } from '../types';

/**
 * Service for Admin User Management
 * Following the specific endpoints requested by the user.
 */
const adminUserService = {
  /**
   * Fetch admins with filters and pagination
   */
  getAdmins: async (
    page: number = 0,
    size: number = 10,
    status?: string,
    search?: string
  ): Promise<PagedResponse<User>> => {
    const response = await apiClient.get<PagedResponse<User>>('/admin/users', {
      params: {
        role: 'ADMIN',
        page,
        size,
        status: status === 'ALL' ? undefined : status,
        search: search || undefined,
      },
    });
    return response.data;
  },

  /**
   * Approve a pending admin
   */
  approveAdmin: async (id: string): Promise<void> => {
    await apiClient.put(`/admin/approve/${id}`);
  },

  /**
   * Reject a pending admin
   */
  rejectAdmin: async (id: string): Promise<void> => {
    await apiClient.put(`/admin/reject/${id}`);
  },

  /**
   * Suspend or Unsuspend an admin
   */
  suspendAdmin: async (id: string, suspend: boolean = true): Promise<void> => {
    await apiClient.put(`/admin/users/${id}/suspend`, { suspend });
  },
};

export default adminUserService;
