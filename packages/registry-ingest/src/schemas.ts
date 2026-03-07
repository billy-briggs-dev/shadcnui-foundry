import { z } from "zod";

/**
 * Zod schema for a shadcn/ui registry item (as returned by the registry API).
 * @see https://ui.shadcn.com/docs/registry
 */
export const ShadcnRegistryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string().optional(),
      type: z.string().optional(),
      target: z.string().optional(),
    })
  ),
  tailwind: z
    .object({
      config: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  cssVars: z
    .object({
      light: z.record(z.string(), z.string()).optional(),
      dark: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type ShadcnRegistryItem = z.infer<typeof ShadcnRegistryItemSchema>;

/**
 * Schema for the registry index (list of available components).
 */
export const ShadcnRegistryIndexSchema = z.object({
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
    })
  ),
});

export type ShadcnRegistryIndex = z.infer<typeof ShadcnRegistryIndexSchema>;
