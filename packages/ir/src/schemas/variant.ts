import { z } from "zod";

export const VariantSchema = z.object({
  /** Variant group name (e.g. "size", "variant", "color") */
  name: z.string(),
  /** Available values for this variant */
  values: z.array(z.string()),
  /** Default value */
  defaultValue: z.string().optional(),
  /** How this variant is applied (CSS class, data attribute, inline style) */
  strategy: z.enum(["class", "data-attr", "inline", "compound"]),
  /** Mapping of value → CSS class name(s) */
  classMap: z.record(z.string(), z.string()).optional(),
});

export type Variant = z.infer<typeof VariantSchema>;
