import { z } from "zod";
import { PropSchema } from "./prop.js";
import { VariantSchema } from "./variant.js";
import { A11ySchema } from "./a11y.js";

/**
 * Classification categories for components.
 * Determines translation complexity and strategy.
 */
export const ComponentCategory = z.enum([
  "primitive",     // Button, Badge, Label — minimal state, no portals
  "form",          // Input, Checkbox, Select, Textarea — form integration
  "layout",        // Card, Separator, AspectRatio — structural/visual only
  "feedback",      // Alert, Progress, Skeleton, Toast — transient/informational
  "navigation",    // Breadcrumb, Pagination, Tabs, NavigationMenu
  "overlay",       // Dialog, Popover, Tooltip, DropdownMenu — portals/focus traps
  "data-display",  // Table, List, Avatar — data rendering patterns
  "composite",     // Accordion, Collapsible — compound components
]);

export type ComponentCategory = z.infer<typeof ComponentCategory>;

/**
 * Source provenance metadata — tracks where the IR came from.
 */
export const ProvenanceSchema = z.object({
  /** Original source registry (e.g. "shadcn/ui") */
  registry: z.string(),
  /** Component name in the source registry */
  registryName: z.string(),
  /** Version or commit ref from the source */
  registryVersion: z.string().optional(),
  /** ISO timestamp of when the IR was generated */
  fetchedAt: z.string().datetime(),
  /** URL of the source artifact, if any */
  sourceUrl: z.string().url().optional(),
  /** SHA-256 hash of the source artifact for integrity checking */
  sourceHash: z.string().optional(),
});

export type Provenance = z.infer<typeof ProvenanceSchema>;

/**
 * The core Intermediate Representation for a component.
 * This is the normalized, framework-neutral component spec.
 */
export const ComponentIRSchema = z.object({
  /** Unique slug identifier for the component (kebab-case) */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  /** Human-readable display name */
  name: z.string(),
  /** Short description of the component */
  description: z.string(),
  /** Classification category */
  category: ComponentCategory,
  /** Component props */
  props: z.array(PropSchema),
  /** Named variants (size, color, appearance) */
  variants: z.array(VariantSchema),
  /** Accessibility requirements */
  a11y: A11ySchema,
  /** Other component IDs this component depends on */
  dependencies: z.array(z.string()),
  /** Arbitrary tags for filtering/search */
  tags: z.array(z.string()),
  /** Where this IR was ingested from */
  provenance: ProvenanceSchema,
  /** ISO timestamp of when this IR was last generated */
  generatedAt: z.string().datetime(),
  /** Version of the IR schema used to generate this spec */
  irVersion: z.string().default("1.0.0"),
});

export type ComponentIR = z.infer<typeof ComponentIRSchema>;
