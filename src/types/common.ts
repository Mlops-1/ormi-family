// Common types used across the application

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

interface TableColumn<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

type Theme = 'light' | 'dark' | 'system';

export type { ApiResponse, PaginationParams, Status, TableColumn, Theme, User };
