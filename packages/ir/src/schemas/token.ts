import { z } from "zod";

export const TokenCategory = z.enum([
  "color",
  "spacing",
  "typography",
  "border",
  "shadow",
  "animation",
  "breakpoint",
  "z-index",
]);

export type TokenCategory = z.infer<typeof TokenCategory>;

export const DesignTokenSchema = z.object({
  /** Token name (kebab-case, e.g. "color-primary-500") */
  name: z.string(),
  /** Category */
  category: TokenCategory,
  /** Raw value */
  value: z.string(),
  /** CSS custom property name (e.g. "--color-primary-500") */
  cssVar: z.string().optional(),
  /** Tailwind token reference (e.g. "primary-500") */
  tailwindToken: z.string().optional(),
  /** Description */
  description: z.string().optional(),
});

export type DesignToken = z.infer<typeof DesignTokenSchema>;
