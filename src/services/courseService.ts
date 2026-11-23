import { apiClient } from './api';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_COURSES } from '../mocks/seedData';
import type { Course, ApiResponse } from '../types';

/**
 * Explicit development-only mock toggle.
 * Defaults to false (production mode): uses live backend APIs and returns
 * genuine empty states / error states with zero silent fallback to seed data.
 * Set VITE_USE_DEV_MOCKS=true in .env.local to enable offline mock fallbacks.
 */
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

export const courseService = {
  async getAllCourses(): Promise<ApiResponse<Course[]>> {
    if (USE_DEV_MOCKS) {
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      return { success: true, data: courses };
    }

    try {
      const res = await apiClient.get('/courses');
      const items = res.data?.data?.items ?? res.data?.data ?? [];
      return {
        success: true,
        data: Array.isArray(items) ? items : [],
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch course catalogue.';
      return {
        success: false,
        data: [],
        message,
      };
    }
  },

  async getCourseBySlug(slug: string): Promise<ApiResponse<Course | null>> {
    if (USE_DEV_MOCKS) {
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      const course = courses.find((c) => c.slug === slug || c.id === slug) || null;
      return { success: !!course, data: course };
    }

    try {
      const res = await apiClient.get(`/courses/${encodeURIComponent(slug)}`);
      const course = res.data?.data;
      if (course) {
        return { success: true, data: course };
      }
      return { success: false, data: null, message: 'Course not found.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch course details.';
      return {
        success: false,
        data: null,
        message,
      };
    }
  },

  async saveCourse(course: Course): Promise<ApiResponse<Course>> {
    if (USE_DEV_MOCKS) {
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      const existingIndex = courses.findIndex((c) => c.id === course.id);
      if (existingIndex >= 0) {
        courses[existingIndex] = course;
      } else {
        courses.unshift(course);
      }
      setStorageItem(STORAGE_KEYS.COURSES, courses);
      return { success: true, data: course };
    }

    try {
      const res = await apiClient.post('/courses', course);
      return { success: true, data: res.data?.data ?? course };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save course.';
      return { success: false, data: course, message };
    }
  },
};
