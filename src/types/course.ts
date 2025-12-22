import type { RoutePoint } from './map';

export interface Course {
  id: string;
  title: string;
  userId: number | null;
  createdAt: string; // ISO timestamp
  spots: RoutePoint[];
  thumbnailUrl?: string; // Tmap Static Map thumbnail
  path?: { lat: number; lon: number }[]; // Actual route path calculation result
}

export interface CourseHistory {
  courses: Course[];
}
