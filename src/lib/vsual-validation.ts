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
    .max(100, 'Company must be 100 characters or less')
    .optional()
    .default(''),
  title: z
    .string()
    .max(100, 'Title must be 100 characters or less')
    .optional()
    .default(''),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal(''))
    .optional()
    .default(''),
  phone: z
    .string()
    .max(30, 'Phone must be 30 characters or less')
    .optional()
    .default(''),
  address: z
    .string()
    .max(200, 'Address must be 200 characters or less')
    .optional()
    .default(''),
});

/** Inferred TypeScript type from the zod schema. */
export type ContactFormValues = z.infer<typeof contactSchema>;
