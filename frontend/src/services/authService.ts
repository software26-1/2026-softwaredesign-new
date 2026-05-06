import client from '../api/client';
import type { ApiResponse } from '../types/common';

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
};
