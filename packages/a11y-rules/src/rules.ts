import type { ValidationIssue } from "@shadcnui-foundry/core";
import type { ComponentIR } from "@shadcnui-foundry/ir";

export type A11yRule = {
  id: string;
  description: string;
  check(ir: ComponentIR): ValidationIssue[];
};

export const A11Y_RULES: A11yRule[] = [
  {
    id: "role-required-for-interactive",
    description: "Interactive components must define at least one ARIA role",
    check(ir) {
      if ((ir.category === "primitive" || ir.category === "form") && ir.a11y.roles.length === 0) {
        return [
          {
            severity: "error",
            code: "A11Y001",
            message: `Interactive component "${ir.id}" must define at least one ARIA role`,
          },
        ];
      }
      return [];
    },
  },
  {
    id: "overlay-requires-focus-trap",
    description: "Overlay components (dialogs, modals) must declare focus trap management",
    check(ir) {
      if (ir.category === "overlay" && ir.a11y.focusManagement !== "trap") {
        return [
          {
            severity: "error",
            code: "A11Y002",
            message: `Overlay component "${ir.id}" must declare focusManagement: "trap"`,
          },
        ];
      }
      return [];
    },
  },
  {
    id: "keyboard-navigation-required",
    description: "Interactive components must define keyboard interaction patterns",
    check(ir) {
      if (
        (ir.category === "primitive" || ir.category === "form" || ir.category === "navigation") &&
        ir.a11y.keyboardInteractions.length === 0
      ) {
        return [
          {
            severity: "warning",
            code: "A11Y003",
            message: `Component "${ir.id}" should define keyboard interaction patterns`,
          },
        ];
      }
      return [];
    },
  },
];
