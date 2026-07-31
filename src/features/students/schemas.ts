import { z } from 'zod';

export const studentFormSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters'),
    rollNo: z
        .string()
        .trim()
        .min(1, 'Roll number is required')
        .max(30, 'Roll number must not exceed 30 characters'),
    classId: z.string().min(1, 'Please select a class'),
    photoUri: z.string().optional().nullable(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
