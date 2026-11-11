import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_COURSES } from '../mocks/seedData';
import type { Course, ApiResponse } from '../types';

const sleep = (ms: number = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const courseService = {
  async getAllCourses(): Promise<ApiResponse<Course[]>> {
    await sleep();
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    return { success: true, data: courses };
  },

  async getCourseBySlug(slug: string): Promise<ApiResponse<Course | null>> {
    await sleep();
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const course = courses.find((c) => c.slug === slug || c.id === slug) || null;
    return { success: !!course, data: course };
  },

  async saveCourse(course: Course): Promise<ApiResponse<Course>> {
    await sleep();
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const existingIndex = courses.findIndex((c) => c.id === course.id);
    if (existingIndex >= 0) {
      courses[existingIndex] = course;
    } else {
      courses.unshift(course);
    }
    setStorageItem(STORAGE_KEYS.COURSES, courses);
    return { success: true, data: course };
  },
};

