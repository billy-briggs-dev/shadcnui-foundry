import type { DesignToken } from "@shadcnui-foundry/ir";

/**
 * Extract CSS variable tokens from a shadcn/ui registry cssVars object.
 */
export function extractTokensFromCssVars(cssVars: {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}): DesignToken[] {
  const tokens: DesignToken[] = [];
  const source = cssVars.light ?? {};

  for (const [key, value] of Object.entries(source)) {
    const name = key.replace(/^--/, "");
    tokens.push({
      name,
      category: inferCategory(name),
      value,
      cssVar: key,
    });
  }

  return tokens;
}

function inferCategory(name: string): DesignToken["category"] {
  if (name.includes("color") || name.includes("background") || name.includes("foreground")) {
    return "color";
  }
  if (name.includes("radius") || name.includes("border")) return "border";
  if (name.includes("shadow")) return "shadow";
  if (name.includes("font") || name.includes("text")) return "typography";
  if (name.includes("spacing") || name.includes("padding") || name.includes("margin")) {
    return "spacing";
  }
  if (name.includes("z-") || name.includes("z_")) return "z-index";
  return "color";
}
