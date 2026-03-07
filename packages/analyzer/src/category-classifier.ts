import type { ComponentCategory } from "@shadcnui-foundry/ir";

const OVERLAY_NAMES = new Set(["dialog", "popover", "tooltip", "dropdown-menu", "context-menu", "alert-dialog", "sheet", "drawer"]);
const FORM_NAMES = new Set(["input", "checkbox", "radio-group", "select", "switch", "slider", "textarea", "form", "label"]);
const NAVIGATION_NAMES = new Set(["breadcrumb", "pagination", "tabs", "navigation-menu", "menubar", "command"]);
const FEEDBACK_NAMES = new Set(["alert", "progress", "skeleton", "sonner", "toast"]);
const LAYOUT_NAMES = new Set(["card", "separator", "aspect-ratio", "scroll-area", "resizable"]);
const COMPOSITE_NAMES = new Set(["accordion", "collapsible"]);
const DATA_DISPLAY_NAMES = new Set(["table", "avatar", "badge", "calendar"]);

/**
 * Classifies a component by name into an IR category.
 */
export function classifyComponent(name: string): ComponentCategory {
  const normalized = name.toLowerCase();
  if (OVERLAY_NAMES.has(normalized)) return "overlay";
  if (FORM_NAMES.has(normalized)) return "form";
  if (NAVIGATION_NAMES.has(normalized)) return "navigation";
  if (FEEDBACK_NAMES.has(normalized)) return "feedback";
  if (LAYOUT_NAMES.has(normalized)) return "layout";
  if (COMPOSITE_NAMES.has(normalized)) return "composite";
  if (DATA_DISPLAY_NAMES.has(normalized)) return "data-display";
  return "primitive";
}
