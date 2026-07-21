import { z } from 'zod';

export const teacherFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name is too long.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(120, 'Email is too long.')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'disabled']),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;
