import client from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/user';
import type { ApiResponse } from '../types/common';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await client.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const res = await client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },
};
