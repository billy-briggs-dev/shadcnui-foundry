import type { TransformedComponent } from "@shadcnui-foundry/core";
import { describe, expect, it } from "vitest";
import { ReactEmitter } from "./emitter.js";

describe("ReactEmitter", () => {
  it("emits forwardRef TSX with variants and a11y role", async () => {
    const transformed: TransformedComponent = {
      componentId: "button",
      framework: "react",
      spec: {
        componentName: "Button",
        propsInterface: [
          {
            name: "disabled",
            type: "boolean",
            required: false,
            defaultValue: "false",
            description: "Whether the button is disabled",
          },
        ],
        variants: [
          {
            name: "variant",
            values: ["default", "outline"],
            defaultValue: "default",
            strategy: "class",
          },
        ],
        a11y: {
          roles: ["button"],
          requiredAttributes: [],
          optionalAttributes: ["aria-disabled"],
        },
      },
    };

    const emitter = new ReactEmitter();
    const result = await emitter.emit(transformed);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const file = result.data[0];
    expect(file).toBeDefined();
    if (!file) {
      return;
    }

    expect(file.path).toBe("button/Button.tsx");
    expect(file.content).toContain("React.forwardRef<HTMLButtonElement, ButtonProps>");
    expect(file.content).toContain("data-variant={variant !== undefined ? variant : undefined}");
    expect(file.content).toContain('role="button"');
    expect(file.content).toContain('"aria-disabled"?: string;');
    expect(file.content).toMatchSnapshot();
  });

  it("emits overlay behavior with portal and keyboard handling for dialog", async () => {
    const transformed: TransformedComponent = {
      componentId: "dialog",
      framework: "react",
      spec: {
        componentName: "Dialog",
        propsInterface: [],
        variants: [],
        a11y: {
          roles: ["dialog"],
          requiredAttributes: ["aria-modal"],
          optionalAttributes: [],
        },
      },
    };

    const emitter = new ReactEmitter();
    const result = await emitter.emit(transformed);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const file = result.data[0];
    expect(file).toBeDefined();
    if (!file) {
      return;
    }

    expect(file.content).toContain('import { createPortal } from "react-dom";');
    expect(file.content).toContain("const [open, setOpen] = React.useState(false);");
    expect(file.content).toContain('event.key === "Escape"');
    expect(file.content).toContain('document.addEventListener("keydown", trapFocus)');
    expect(file.content).toContain("return createPortal(overlayContent, document.body);");
  });
});
