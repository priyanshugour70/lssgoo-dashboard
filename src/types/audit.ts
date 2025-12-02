import { z } from 'zod';

// Audit Query Schemas
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Types
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// Response Types
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

