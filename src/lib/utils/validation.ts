// src/lib/utils/validation.ts
import { z } from 'zod';
import { errorService, ErrorSeverity, ErrorSource } from '$lib/services/errorService';

/**
 * Type for validation options
 */
export interface ValidationOptions {
  errorMessage?: string;
  source?: ErrorSource;
  severity?: ErrorSeverity;
  throwOnError?: boolean;
}

/**
 * Default validation options
 */
const defaultValidationOptions: ValidationOptions = {
  source: ErrorSource.VALIDATION,
  severity: ErrorSeverity.WARNING,
  throwOnError: false
};

/**
 * Validates data against a Zod schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Validated data or null if validation fails
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = {}
): T | null {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the validation errors
      const formattedErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      
      // Log the validation error
      errorService.logError({
        message: opts.errorMessage || 'Validation error',
        details: formattedErrors,
        severity: opts.severity || ErrorSeverity.WARNING,
        source: opts.source || ErrorSource.VALIDATION,
        originalError: error,
        retryable: false
      });
      
      // Throw if requested
      if (opts.throwOnError) {
        throw new Error(`Validation error: ${formattedErrors}`);
      }
      
      return null;
    }
    
    // If it's not a ZodError, it's an unexpected error
    errorService.logError({
      message: 'Unexpected validation error',
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN,
      originalError: error,
      retryable: false
    });
    
    if (opts.throwOnError) {
      throw error;
    }
    
    return null;
  }
}

/**
 * Validates data against a Zod schema and returns a result object
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param options Validation options
 * @returns Object with success flag, validated data, and errors
 */
export function validateWithResult<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions = {}
): { success: boolean; data: T | null; errors: string[] } {
  const opts = { ...defaultValidationOptions, ...options };
  
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the validation errors
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      // Log the validation error
      errorService.logError({
        message: opts.errorMessage || 'Validation error',
        details: errors.join('; '),
        severity: opts.severity || ErrorSeverity.WARNING,
        source: opts.source || ErrorSource.VALIDATION,
        originalError: error,
        retryable: false
      });
      
      return {
        success: false,
        data: null,
        errors
      };
    }
    
    // If it's not a ZodError, it's an unexpected error
    errorService.logError({
      message: 'Unexpected validation error',
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN,
      originalError: error,
      retryable: false
    });
    
    return {
      success: false,
      data: null,
      errors: ['Unexpected validation error']
    };
  }
}

/**
 * Creates a validator function for a specific schema
 * @param schema Zod schema to validate against
 * @param defaultOptions Default validation options
 * @returns Validator function
 */
export function createValidator<T>(
  schema: z.ZodType<T>,
  defaultOptions: ValidationOptions = {}
): (data: unknown, options?: ValidationOptions) => T | null {
  return (data: unknown, options: ValidationOptions = {}) => {
    return validate(schema, data, { ...defaultOptions, ...options });
  };
}

/**
 * Creates a validator function that returns a result object
 * @param schema Zod schema to validate against
 * @param defaultOptions Default validation options
 * @returns Validator function
 */
export function createValidatorWithResult<T>(
  schema: z.ZodType<T>,
  defaultOptions: ValidationOptions = {}
): (data: unknown, options?: ValidationOptions) => { success: boolean; data: T | null; errors: string[] } {
  return (data: unknown, options: ValidationOptions = {}) => {
    return validateWithResult(schema, data, { ...defaultOptions, ...options });
  };
}

/**
 * Common schema definitions
 */
export const schemas = {
  // Basic types
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
  date: z.date(),
  
  // Refined types
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  
  // Common patterns
  nonEmptyString: z.string().min(1),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  
  // Object helpers
  nullable: <T>(schema: z.ZodType<T>) => schema.nullable(),
  optional: <T>(schema: z.ZodType<T>) => schema.optional(),
  array: <T>(schema: z.ZodType<T>) => z.array(schema),
  record: <T>(schema: z.ZodType<T>) => z.record(schema)
};