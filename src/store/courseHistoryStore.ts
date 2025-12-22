import type { Course } from '@/types/course';
import type { RoutePoint } from '@/types/map';
import { generateCourseStaticMapUrl } from '@/utils/mapUtils';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CourseHistoryState {
  courses: Course[];

  // Actions
  addCourse: (
    title: string,
    spots: RoutePoint[],
    userId: string,
    customThumbnailUrl?: string,
    path?: { lat: number; lon: number }[]
  ) => string;
  removeCourse: (courseId: string) => void;
  getCourseById: (id: string) => Course | undefined;
  clearHistory: () => void;

  // Initialization
  loadFromStorage: () => void;
}

export const useCourseHistoryStore = create<CourseHistoryState>()(
  persist(
    (set, get) => ({
      courses: [],

      addCourse: (
        title: string,
        spots: RoutePoint[],
        userId: string,
        customThumbnailUrl?: string,
        path?: { lat: number; lon: number }[]
      ) => {
        // Generate thumbnail URL for the course
        const generateUrl = generateCourseStaticMapUrl(spots, 400, 250);
        const thumbnailUrl = customThumbnailUrl || generateUrl;

        const newCourse: Course = {
          id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          userId: Number(userId), // Ensure number type
          createdAt: new Date().toISOString(),
          spots: spots.map((spot: RoutePoint) => ({ ...spot })), // Deep copy with type
          thumbnailUrl,
          path, // Save actual route path
        };

        set((state) => ({
          courses: [newCourse, ...state.courses],
        }));

        return newCourse.id;
      },

      removeCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== id),
        }));
      },

      getCourseById: (id) => {
        const state = get();
        return state.courses.find((course) => course.id === id);
      },

      clearHistory: () => {
        set({ courses: [] });
      },

      loadFromStorage: () => {
        // This is handled automatically by persist middleware
        // This method can be used to manually trigger a reload if needed
        const storedData = localStorage.getItem('course-history-storage');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (parsed.state && Array.isArray(parsed.state.courses)) {
              set({ courses: parsed.state.courses });
            }
          } catch (error) {
            console.error('Failed to load course history from storage:', error);
          }
        }
      },
    }),
    {
      name: 'course-history-storage',
      partialize: (state) => ({
        courses: state.courses,
      }),
    }
  )
);
