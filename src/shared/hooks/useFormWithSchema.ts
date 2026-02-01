/**
 * useFormWithSchema - Generic form hook with Zod validation
 *
 * Wraps react-hook-form with zod resolver for type-safe form handling.
 */

import { useForm, UseFormProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Generic form hook with Zod schema validation
 *
 * @example
 * ```tsx
 * import { vehicleSchema, VehicleFormData } from '@/src/shared/schemas';
 *
 * function VehicleForm() {
 *   const form = useFormWithSchema(vehicleSchema, {
 *     defaultValues: { make: '', model: '', year: 2024 }
 *   });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('make')} />
 *       {form.formState.errors.make?.message}
 *     </form>
 *   );
 * }
 * ```
 */
export function useFormWithSchema<T extends FieldValues>(
  schema: z.ZodType<T>,
  options?: Omit<UseFormProps<T>, "resolver">,
) {
  return useForm<T>({
    ...options,
    // @ts-expect-error - zodResolver types are not fully compatible with useForm
    resolver: zodResolver(schema),
    mode: options?.mode ?? "onBlur",
  });
}

/**
 * Form hook with validation on change (for more immediate feedback)
 */
export function useFormWithSchemaOnChange<T extends FieldValues>(
  schema: z.ZodType<T>,
  options?: Omit<UseFormProps<T>, "resolver" | "mode">,
) {
  return useForm<T>({
    ...options,
    // @ts-expect-error - zodResolver types are not fully compatible with useForm
    resolver: zodResolver(schema),
    mode: "onChange",
  });
}

/**
 * Form hook with validation only on submit (for better UX with complex forms)
 */
export function useFormWithSchemaOnSubmit<T extends FieldValues>(
  schema: z.ZodType<T>,
  options?: Omit<UseFormProps<T>, "resolver" | "mode">,
) {
  return useForm<T>({
    ...options,
    // @ts-expect-error - zodResolver types are not fully compatible with useForm
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
}
