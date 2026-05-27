import client from '../api/client';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequest {
  id: number;
  requestType?: string;
  requestDetail?: string;
  status?: ApprovalStatus;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ApprovalCreateBody {
  requestType: string;
  requestDetail: string;
}

// New approval-request endpoints return raw DTOs (read res.data directly).
export const approvalService = {
  async create(body: ApprovalCreateBody): Promise<ApprovalRequest> {
    const res = await client.post<ApprovalRequest>('/approval-requests', body);
    return res.data;
  },

  async list(status?: ApprovalStatus, requestType?: string): Promise<ApprovalRequest[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (requestType) params.request_type = requestType;
    const res = await client.get<ApprovalRequest[]>('/approval-requests', {
      params: Object.keys(params).length ? params : undefined,
    });
    return res.data;
  },

  async process(id: number, status: ApprovalStatus): Promise<ApprovalRequest | { message?: string }> {
    const res = await client.patch<ApprovalRequest | { message?: string }>(`/approval-requests/${id}`, { status });
    return res.data;
  },
};
