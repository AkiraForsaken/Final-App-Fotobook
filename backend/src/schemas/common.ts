import { z } from 'zod';

export const sharingModeSchema = z.enum(['public', 'private']);
export type SharingMode = z.infer<typeof sharingModeSchema>;

export const idParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
	cursor: z.coerce.number().int().positive().optional(),
	take: z.coerce.number().int().min(1).max(100).default(20),
});

export const offsetPaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	take: z.coerce.number().int().min(1).max(100).default(40),
});
