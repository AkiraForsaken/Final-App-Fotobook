import { z } from 'zod';

export const sharingModeSchema = z.enum(['public', 'private']);
export type SharingMode = z.infer<typeof sharingModeSchema>;
