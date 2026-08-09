import { z } from 'zod';

export const createSessionSchema = z.object({
    classId: z.string().min(1, 'Please select a class'),
    periodLabel: z.string().optional(),
});

export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;
