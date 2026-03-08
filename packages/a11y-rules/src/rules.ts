import type { ValidationIssue } from "@shadcnui-foundry/core";
import type { ComponentIR } from "@shadcnui-foundry/ir";

export type A11yRule = {
  id: string;
  description: string;
  check(ir: ComponentIR): ValidationIssue[];
};

const INTERACTIVE_CATEGORIES = new Set(["primitive", "form", "navigation", "overlay", "composite"]);
const WCAG_CRITERIA_PATTERN = /^\d\.\d\.\d$/;

function hasCriterion(ir: ComponentIR, criterion: string): boolean {
  return ir.a11y.wcagCriteria.includes(criterion);
}

function isInteractive(ir: ComponentIR): boolean {
  return INTERACTIVE_CATEGORIES.has(ir.category);
}

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
  {
    id: "interactive-wcag-criteria-required",
    description: "Interactive components should include WCAG success criteria references",
    check(ir) {
      if (isInteractive(ir) && ir.a11y.wcagCriteria.length === 0) {
        return [
          {
            severity: "warning",
            code: "A11Y004",
            message: `Interactive component "${ir.id}" should include WCAG criteria references`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "wcag-criterion-format",
    description: "WCAG criteria references must use x.x.x format",
    check(ir) {
      const invalidCriteria = ir.a11y.wcagCriteria.filter(
        (criterion) => !WCAG_CRITERIA_PATTERN.test(criterion),
      );

      if (invalidCriteria.length > 0) {
        return [
          {
            severity: "error",
            code: "A11Y005",
            message: `Component "${ir.id}" has invalid WCAG criteria format: ${invalidCriteria.join(", ")}`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "interactive-keyboard-wcag",
    description: "Interactive components should map keyboard support to WCAG 2.1.1",
    check(ir) {
      if (isInteractive(ir) && !hasCriterion(ir, "2.1.1")) {
        return [
          {
            severity: "warning",
            code: "A11Y006",
            message: `Interactive component "${ir.id}" should include WCAG criterion 2.1.1 (Keyboard)`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "interactive-focus-visible-wcag",
    description: "Interactive components should map focus visibility to WCAG 2.4.7",
    check(ir) {
      if (isInteractive(ir) && !hasCriterion(ir, "2.4.7")) {
        return [
          {
            severity: "warning",
            code: "A11Y007",
            message: `Interactive component "${ir.id}" should include WCAG criterion 2.4.7 (Focus Visible)`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "overlay-focus-order-wcag",
    description: "Overlay components should include WCAG 2.4.3 focus order references",
    check(ir) {
      if (ir.category === "overlay" && !hasCriterion(ir, "2.4.3")) {
        return [
          {
            severity: "warning",
            code: "A11Y008",
            message: `Overlay component "${ir.id}" should include WCAG criterion 2.4.3 (Focus Order)`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "form-info-relationships-wcag",
    description: "Form components should include WCAG 1.3.1 references",
    check(ir) {
      if (ir.category === "form" && !hasCriterion(ir, "1.3.1")) {
        return [
          {
            severity: "warning",
            code: "A11Y009",
            message: `Form component "${ir.id}" should include WCAG criterion 1.3.1 (Info and Relationships)`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "live-region-status-messages-wcag",
    description: "Live region components should include WCAG 4.1.3 status message references",
    check(ir) {
      if (ir.a11y.liveRegion && !hasCriterion(ir, "4.1.3")) {
        return [
          {
            severity: "warning",
            code: "A11Y010",
            message: `Live region component "${ir.id}" should include WCAG criterion 4.1.3 (Status Messages)`,
          },
        ];
      }

      return [];
    },
  },
  {
    id: "tooltip-content-on-hover-wcag",
    description: "Tooltip components should include WCAG 1.4.13 references",
    check(ir) {
      if (
        (ir.id === "tooltip" || ir.a11y.roles.includes("tooltip")) &&
        !hasCriterion(ir, "1.4.13")
      ) {
        return [
          {
            severity: "warning",
            code: "A11Y011",
            message: `Tooltip component "${ir.id}" should include WCAG criterion 1.4.13 (Content on Hover or Focus)`,
          },
        ];
      }

      return [];
    },
  },
];
