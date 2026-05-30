import client from '../api/client';
import type { Feedback, FeedbackCreateRequest } from '../types/feedback';
import type { ApiResponse } from '../types/common';

export const feedbackService = {
  async getByStudent(studentId: number, category?: string): Promise<Feedback[]> {
    const res = await client.get<ApiResponse<Feedback[]>>('/feedbacks', {
      params: { student_id: studentId, ...(category ? { category } : {}) },
    });
    return res.data.data;
  },

  async create(data: FeedbackCreateRequest): Promise<Feedback> {
    const res = await client.post<ApiResponse<Feedback>>('/feedbacks', data);
    return res.data.data;
  },

  async update(feedbackId: number, data: Partial<FeedbackCreateRequest>): Promise<Feedback> {
    const res = await client.patch<ApiResponse<Feedback>>(`/feedbacks/${feedbackId}`, data);
    return res.data.data;
  },

  async delete(feedbackId: number): Promise<void> {
    await client.delete(`/feedbacks/${feedbackId}`);
  },
};
