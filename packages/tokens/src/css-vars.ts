import type { DesignToken } from "@shadcnui-foundry/ir";

/**
 * Serialize design tokens back to CSS custom properties.
 */
export function tokensToCssVars(tokens: DesignToken[]): string {
  const lines = tokens
    .filter((t) => t.cssVar)
    .map((t) => `  ${t.cssVar}: ${t.value};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}
