import { z } from 'zod';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  traceId: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: ApiErrorDetail[];
  };
  traceId: string;
}

export const CursorPaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CursorPaginationParams = z.infer<typeof CursorPaginationParamsSchema>;

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}
