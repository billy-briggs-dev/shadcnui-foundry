import { z } from "zod";

export const A11ySchema = z.object({
  /** ARIA role(s) for the component root */
  roles: z.array(z.string()),
  /** Required ARIA attributes */
  requiredAttributes: z.array(z.string()),
  /** Optional ARIA attributes */
  optionalAttributes: z.array(z.string()),
  /** Keyboard interaction patterns (e.g. "Enter: activate", "Escape: close") */
  keyboardInteractions: z.array(
    z.object({
      key: z.string(),
      description: z.string(),
    })
  ),
  /** Focus management strategy */
  focusManagement: z
    .enum(["none", "auto", "trap", "restore"])
    .default("none"),
  /** Whether the component should be announced to screen readers on change */
  liveRegion: z.boolean().default(false),
  /** WCAG success criteria references */
  wcagCriteria: z.array(z.string()),
});

export type A11y = z.infer<typeof A11ySchema>;
