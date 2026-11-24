import { apiClient } from './api';
import type { ApiResponse } from '../types/common.types';

/**
 * LMS-004 / LMS-005: lessons for an actively enrolled student. The server
 * decides availability (published, past its publish time, previous lesson
 * completed when it unlocks in sequence) and serves content only when open.
 */
export interface LessonOutlineItem {
  id: string;
  title: string;
  lessonType?: string;
  durationMinutes: number;
  state: 'available' | 'scheduled' | 'locked';
  isCompleted: boolean;
  availableAt?: string;
  requiresLessonId?: string;
  requiresLessonTitle?: string;
}

export interface LessonContent {
  id: string;
  title: string;
  lessonType?: string;
  durationMinutes: number;
  videoUrl?: string;
  studyMaterialText?: string;
  isDownloadRestricted: boolean;
  isCompleted: boolean;
}

const message = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

export const lmsService = {
  async getOutline(courseId: string): Promise<ApiResponse<LessonOutlineItem[]>> {
    try {
      const res = await apiClient.get(`/teachers/lms/courses/${encodeURIComponent(courseId)}/lessons`);
      return { success: true, data: res.data?.data ?? [] };
    } catch (err: any) {
      return { success: false, data: [], error: message(err, 'Lessons could not be loaded.') };
    }
  },

  async getLesson(courseId: string, lessonId: string): Promise<ApiResponse<LessonContent | null>> {
    try {
      const res = await apiClient.get(`/teachers/lms/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`);
      return { success: true, data: res.data?.data ?? null };
    } catch (err: any) {
      return { success: false, data: null, error: message(err, 'This lesson could not be opened.') };
    }
  },
};
