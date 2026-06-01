import client from '../api/client';

export interface Notification {
  id: number;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

// New notification endpoints return raw DTOs (read res.data directly).
export const notificationService = {
  async list(isRead?: boolean): Promise<Notification[]> {
    const res = await client.get<any[]>('/notifications', {
      params: isRead != null ? { is_read: isRead } : undefined,
    });
    return res.data.map((n: any) => ({ ...n, isRead: n.isRead ?? n.read ?? false }));
  },

  async markRead(id: number): Promise<Notification | { message?: string }> {
    const res = await client.patch<Notification | { message?: string }>(`/notifications/${id}/read`);
    return res.data;
  },
};
