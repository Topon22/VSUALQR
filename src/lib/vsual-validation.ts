/**
 * VSUAL Networking App — Zod Validation Schema
 *
 * Used by react-hook-form in the contact form for
 * client-side validation with type inference.
 */
import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  company: z
    .string()
    .max(100, 'Company must be 100 characters or less'),
  title: z
    .string()
    .max(100, 'Title must be 100 characters or less'),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal('')),
  phone: z
    .string()
    .max(30, 'Phone must be 30 characters or less'),
  address: z
    .string()
    .max(200, 'Address must be 200 characters or less'),
});

/** Inferred TypeScript type from the zod schema. */
export type ContactFormValues = z.infer<typeof contactSchema>;
