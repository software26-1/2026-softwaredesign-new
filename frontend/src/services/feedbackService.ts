import client from '../api/client';
import type { Feedback, FeedbackCreateRequest } from '../types/feedback';
import type { ApiResponse } from '../types/common';

export const feedbackService = {
  async getByStudent(studentId: number): Promise<Feedback[]> {
    const res = await client.get<ApiResponse<Feedback[]>>(`/students/${studentId}/feedbacks`);
    return res.data.data;
  },

  async getMyFeedbacks(): Promise<Feedback[]> {
    const res = await client.get<ApiResponse<Feedback[]>>('/feedbacks');
    return res.data.data;
  },

  async create(studentId: number, data: FeedbackCreateRequest): Promise<Feedback> {
    const res = await client.post<ApiResponse<Feedback>>(`/students/${studentId}/feedbacks`, data);
    return res.data.data;
  },

  async update(feedbackId: number, data: Partial<FeedbackCreateRequest>): Promise<Feedback> {
    const res = await client.patch<ApiResponse<Feedback>>(`/feedbacks/${feedbackId}`, data);
    return res.data.data;
  },

  async delete(feedbackId: number): Promise<void> {
    await client.delete(`/feedbacks/${feedbackId}`);
  },

  async updateVisibility(feedbackId: number, isPublicToStudent: boolean, isPublicToParent: boolean): Promise<Feedback> {
    const res = await client.patch<ApiResponse<Feedback>>(`/feedbacks/${feedbackId}/visibility`, {
      isPublicToStudent,
      isPublicToParent,
    });
    return res.data.data;
  },
};
