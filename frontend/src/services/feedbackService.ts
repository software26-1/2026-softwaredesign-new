import client from '../api/client';
import type { Feedback, FeedbackCreateRequest } from '../types/feedback';

export const feedbackService = {
  async getByStudent(studentId: number, category?: string): Promise<Feedback[]> {
    const res = await client.get<Feedback[]>('/feedbacks', {
      params: { student_id: studentId, ...(category ? { category } : {}) },
    });
    return res.data;
  },

  async create(data: FeedbackCreateRequest): Promise<Feedback> {
    const res = await client.post<Feedback>('/feedbacks', data);
    return res.data;
  },

  async update(feedbackId: number, data: Partial<FeedbackCreateRequest>): Promise<Feedback> {
    const res = await client.patch<Feedback>(`/feedbacks/${feedbackId}`, data);
    return res.data;
  },

  async delete(feedbackId: number): Promise<void> {
    await client.delete(`/feedbacks/${feedbackId}`);
  },
};
