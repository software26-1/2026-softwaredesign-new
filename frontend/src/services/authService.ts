import client from '../api/client';
import type { ApiResponse } from '../types/common';

export interface MyProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  schoolName: string;
  createdAt: string;
}

export const authService = {
  redirectToGoogle(role: string): void {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/oauth2/google?role=${role}`;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const res = await client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await client.post('/auth/password/change', { currentPassword, newPassword });
  },

  async resetPassword(email: string, newPassword: string): Promise<void> {
    await client.post('/auth/password/reset', { email, newPassword });
  },

  async getProfile(): Promise<MyProfile> {
    const res = await client.get<ApiResponse<MyProfile>>('/users/me');
    return res.data.data;
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<MyProfile> {
    const res = await client.patch<ApiResponse<MyProfile>>('/users/me', data);
    return res.data.data;
  },
};
