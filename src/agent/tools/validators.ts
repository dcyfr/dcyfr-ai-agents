/**
 * Tool input validators using Zod
 */

import { z } from 'zod';

/**
 * Common validation schemas for tool inputs
 */
export const validators = {
  /** String that must be non-empty */
  nonEmptyString: z.string().min(1, 'String cannot be empty'),

  /** Positive integer */
  positiveInt: z.number().int().positive(),

  /** Non-negative integer */
  nonNegativeInt: z.number().int().nonnegative(),

  /** Number in range 0-1 */
  probability: z.number().min(0).max(1),

  /** URL string */
  url: z.string().url(),

  /** Email string */
  email: z.string().email(),

  /** Date string (ISO 8601) */
  dateString: z.string().datetime(),

  /** JSON string */
  jsonString: z.string().refine(
    (str) => {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid JSON string' }
  ),

  /** File path */
  filePath: z.string().refine(
    (path) => {
      // Basic validation - checks for valid characters
      return /^[a-zA-Z0-9_\-./\\]+$/.test(path);
    },
    { message: 'Invalid file path' }
  ),

  /** Limited string length */
  limitedString: (maxLength: number): z.ZodString =>
    z.string().max(maxLength, `String must be at most ${maxLength} characters`),

  /** Array with size constraints */
  boundedArray: <T>(itemSchema: z.ZodType<T>, minLength: number, maxLength: number): z.ZodArray<z.ZodType<T>> =>
    z.array(itemSchema).min(minLength).max(maxLength),

  /** Enum from string literals */
  stringEnum: <T extends string>(values: readonly T[]): z.ZodEnum<[T, ...T[]]> => z.enum(values as [T, ...T[]]),

  /** Record with specific value type */
  record: <T>(valueSchema: z.ZodType<T>): z.ZodRecord<z.ZodString, z.ZodType<T>> => z.record(z.string(), valueSchema),
};

/**
 * Tool input validation decorator
 */
export function validateToolInput<TInput>(
  schema: z.ZodType<TInput>
): (input: unknown) => TInput {
  return (input: unknown): TInput => {
    return schema.parse(input);
  };
}

/**
 * Common tool input patterns
 */
export const commonInputSchemas = {
  /** Simple text input */
  textInput: z.object({
    text: validators.nonEmptyString,
  }),

  /** Query with optional parameters */
  queryInput: z.object({
    query: validators.nonEmptyString,
    limit: validators.positiveInt.optional(),
    offset: validators.nonNegativeInt.optional(),
  }),

  /** File operation input */
  fileInput: z.object({
    path: validators.filePath,
    encoding: z.enum(['utf-8', 'ascii', 'base64']).optional(),
  }),

  /** API request input */
  apiRequestInput: z.object({
    url: validators.url,
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
  }),

  /** Search input */
  searchInput: z.object({
    query: validators.nonEmptyString,
    filters: z.record(z.unknown()).optional(),
    limit: validators.positiveInt.default(10),
  }),

  /** ID-based lookup */
  idInput: z.object({
    id: validators.nonEmptyString,
  }),
};
