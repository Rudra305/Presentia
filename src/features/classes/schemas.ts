import { z } from 'zod';

export const classFormSchema = z.object({
    name: z
        .string()
        .min(2, 'Class name must be at least 2 characters.')
        .max(80, 'Class name is too long.'),
    grade: z.string().max(30, 'Grade is too long.').optional().or(z.literal('')),
    section: z.string().max(30, 'Section is too long.').optional().or(z.literal('')),
    teacherId: z.string().optional().or(z.literal('')),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
