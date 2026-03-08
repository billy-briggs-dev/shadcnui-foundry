import type { RawRegistryArtifact } from "@shadcnui-foundry/core";
import type { PipelineResult, Prop, Variant } from "@shadcnui-foundry/ir";
import { describe, expect, it } from "vitest";
import { ShadcnAnalyzer } from "./shadcn-analyzer.js";

function expectSuccess<T>(result: PipelineResult<T>): T {
  if (!result.success) {
    const errorMessages = result.errors
      .map((error) => `[${error.code}] ${error.message}`)
      .join(", ");
    throw new Error(`Expected success but received errors: ${errorMessages}`);
  }

  return result.data;
}

const CATALOG_COMPONENTS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "form",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "menubar",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle",
  "toggle-group",
  "tooltip",
] as const;

function normalizeProps(props: Prop[]): Array<Record<string, unknown>> {
  return [...props]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((prop) => ({
      name: prop.name,
      type: prop.type,
      required: prop.required,
      ...(prop.defaultValue !== undefined && { defaultValue: prop.defaultValue }),
      ...(prop.values !== undefined && { values: prop.values }),
    }));
}

function normalizeVariants(variants: Variant[]): Array<Record<string, unknown>> {
  return [...variants]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((variant) => ({
      name: variant.name,
      values: [...variant.values].sort(),
      strategy: variant.strategy,
      ...(variant.defaultValue !== undefined && { defaultValue: variant.defaultValue }),
    }));
}

describe("ShadcnAnalyzer", () => {
  it("extracts props and cva variants from source files", async () => {
    const analyzer = new ShadcnAnalyzer();

    const artifact: RawRegistryArtifact = {
      name: "button",
      contentType: "json",
      sourceUrl: "https://ui.shadcn.com/r/styles/new-york/button.json",
      fetchedAt: "2026-03-07T00:00:00.000Z",
      content: {
        name: "button",
        type: "registry:ui",
        files: [
          {
            path: "ui/button.tsx",
            content: `
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva("base", {
  variants: {
    variant: {
      default: "x",
      outline: "y",
    },
    size: {
      default: "a",
      sm: "b",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return <button {...props} />
  }
)
            `,
          },
        ],
      },
    };

    const result = expectSuccess(await analyzer.analyze(artifact));

    expect(result.variants).toEqual([
      {
        name: "variant",
        values: ["default", "outline"],
        defaultValue: "default",
        strategy: "class",
      },
      {
        name: "size",
        values: ["default", "sm"],
        defaultValue: "default",
        strategy: "class",
      },
    ]);

    expect(result.props).toEqual(
      expect.arrayContaining([
        {
          name: "asChild",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: false,
        },
        {
          name: "variant",
          type: "enum",
          values: ["default", "outline"],
          required: false,
          defaultValue: '"default"',
          forwarded: false,
        },
        {
          name: "size",
          type: "enum",
          values: ["default", "sm"],
          required: false,
          defaultValue: '"default"',
          forwarded: false,
        },
      ]),
    );

    expect({
      id: result.id,
      category: result.category,
      roles: result.a11y.roles,
      props: normalizeProps(result.props),
      variants: normalizeVariants(result.variants),
    }).toMatchSnapshot();
  });

  it("returns a valid IR when files are missing", async () => {
    const analyzer = new ShadcnAnalyzer();

    const artifact: RawRegistryArtifact = {
      name: "card",
      contentType: "json",
      fetchedAt: "2026-03-07T00:00:00.000Z",
      content: {
        name: "card",
        type: "registry:ui",
      },
    };

    const result = expectSuccess(await analyzer.analyze(artifact));

    expect(result.props).toEqual([]);
    expect(result.variants).toEqual([]);
    expect(result.category).toBe("layout");
  });

  it("generates a catalog analysis snapshot for all known registry component names", async () => {
    const analyzer = new ShadcnAnalyzer();

    const analyzed = await Promise.all(
      CATALOG_COMPONENTS.map(async (name) => {
        const artifact: RawRegistryArtifact = {
          name,
          contentType: "json",
          sourceUrl: `https://ui.shadcn.com/r/styles/new-york/${name}.json`,
          fetchedAt: "2026-03-07T00:00:00.000Z",
          content: {
            name,
            type: "registry:ui",
            files: [],
          },
        };

        const ir = expectSuccess(await analyzer.analyze(artifact));
        return {
          id: ir.id,
          name: ir.name,
          category: ir.category,
          roles: ir.a11y.roles,
        };
      }),
    );

    expect(analyzed).toMatchSnapshot();
  });

  it("infers interactive accessibility metadata for overlay and select components", async () => {
    const analyzer = new ShadcnAnalyzer();

    const dialogResult = expectSuccess(
      await analyzer.analyze({
        name: "dialog",
        contentType: "json",
        fetchedAt: "2026-03-07T00:00:00.000Z",
        content: {
          name: "dialog",
          type: "registry:ui",
        },
      }),
    );

    const dropdownResult = expectSuccess(
      await analyzer.analyze({
        name: "dropdown-menu",
        contentType: "json",
        fetchedAt: "2026-03-07T00:00:00.000Z",
        content: {
          name: "dropdown-menu",
          type: "registry:ui",
        },
      }),
    );

    const selectResult = expectSuccess(
      await analyzer.analyze({
        name: "select",
        contentType: "json",
        fetchedAt: "2026-03-07T00:00:00.000Z",
        content: {
          name: "select",
          type: "registry:ui",
        },
      }),
    );

    expect(dialogResult.a11y.focusManagement).toBe("trap");
    expect(dialogResult.a11y.requiredAttributes).toContain("aria-modal");
    expect(dialogResult.a11y.keyboardInteractions).toEqual(
      expect.arrayContaining([
        { key: "Escape", description: "Close dialog" },
        { key: "Tab", description: "Move focus within the dialog" },
      ]),
    );

    expect(dropdownResult.a11y.focusManagement).toBe("restore");
    expect(dropdownResult.a11y.keyboardInteractions).toEqual(
      expect.arrayContaining([
        { key: "ArrowDown", description: "Move to next menu item" },
        { key: "Escape", description: "Close menu" },
      ]),
    );

    expect(selectResult.a11y.roles).toEqual(["listbox"]);
    expect(selectResult.a11y.keyboardInteractions).toEqual(
      expect.arrayContaining([
        { key: "Enter", description: "Open select and choose an option" },
        { key: "ArrowUp", description: "Move to previous option" },
      ]),
    );
    expect(selectResult.a11y.wcagCriteria).toContain("4.1.2");
  });
});
