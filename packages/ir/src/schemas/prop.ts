import { z } from "zod";

export const PropType = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
  "union",
  "object",
  "array",
  "function",
  "node", // Framework-specific render content (ReactNode, Slot, etc.)
  "ref", // Forwarded ref
  "unknown",
]);

export type PropType = z.infer<typeof PropType>;

export const PropSchema = z.object({
  /** Prop name (camelCase) */
  name: z.string(),
  /** Type of the prop */
  type: PropType,
  /** For enum/union types: allowed values */
  values: z.array(z.string()).optional(),
  /** Whether the prop is required */
  required: z.boolean().default(false),
  /** Default value as a serialized string */
  defaultValue: z.string().optional(),
  /** Human-readable description */
  description: z.string().optional(),
  /** Whether this is forwarded to the underlying DOM element */
  forwarded: z.boolean().default(false),
  /** Deprecation notice, if any */
  deprecated: z.string().optional(),
});

export type Prop = z.infer<typeof PropSchema>;
