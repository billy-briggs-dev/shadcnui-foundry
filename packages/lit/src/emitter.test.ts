import type { ComponentIR } from "@shadcnui-foundry/ir";
import { describe, expect, it } from "vitest";
import { LitEmitter } from "./emitter.js";

describe("LitEmitter", () => {
  it("emits LitElement with reactive properties and a11y/variant attributes", async () => {
    const ir: ComponentIR = {
      id: "button",
      name: "Button",
      description: "A button",
      category: "primitive",
      props: [
        {
          name: "disabled",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: false,
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
        keyboardInteractions: [],
        focusManagement: "none",
        liveRegion: false,
        wcagCriteria: [],
      },
      dependencies: [],
      tags: [],
      provenance: {
        registry: "test",
        registryName: "button",
        fetchedAt: "2026-03-07T00:00:00.000Z",
      },
      generatedAt: "2026-03-07T00:00:00.000Z",
      irVersion: "1.0.0",
    };

    const emitter = new LitEmitter();
    const result = await emitter.emit({
      componentId: "button",
      framework: "lit",
      spec: { ir },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const file = result.data[0];
    expect(file).toBeDefined();
    if (!file) {
      return;
    }

    expect(file.path).toBe("button/foundry-button.ts");
    expect(file.content).toContain('import { customElement, property } from "lit/decorators.js";');
    expect(file.content).toContain('@property({ attribute: "variant" })');
    expect(file.content).toContain("data-variant");
    expect(file.content).toContain('role="button"');
    expect(file.content).toMatchSnapshot();
  });

  it("emits overlay behavior with open state and keyboard handling for dialog", async () => {
    const ir: ComponentIR = {
      id: "dialog",
      name: "Dialog",
      description: "A dialog",
      category: "overlay",
      props: [],
      variants: [],
      a11y: {
        roles: ["dialog"],
        requiredAttributes: ["aria-modal"],
        optionalAttributes: [],
        keyboardInteractions: [
          { key: "Escape", description: "Escape closes dialog" },
          { key: "Tab", description: "Tab traps focus" },
        ],
        focusManagement: "trap",
        liveRegion: false,
        wcagCriteria: ["2.1.2", "2.4.3"],
      },
      dependencies: [],
      tags: [],
      provenance: {
        registry: "test",
        registryName: "dialog",
        fetchedAt: "2026-03-07T00:00:00.000Z",
      },
      generatedAt: "2026-03-07T00:00:00.000Z",
      irVersion: "1.0.0",
    };

    const emitter = new LitEmitter();
    const result = await emitter.emit({
      componentId: "dialog",
      framework: "lit",
      spec: { ir },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const file = result.data[0];
    expect(file).toBeDefined();
    if (!file) {
      return;
    }

    expect(file.content).toContain("@property({ type: Boolean }) open = false;");
    expect(file.content).toContain('document.addEventListener("keydown", this.onDocumentKeydown)');
    expect(file.content).toContain('if (event.key === "Escape")');
    expect(file.content).toContain('data-foundry-overlay="dialog"');
  });

  it("emits accordion-specific state model", async () => {
    const ir: ComponentIR = {
      id: "accordion",
      name: "Accordion",
      description: "A collapsible accordion",
      category: "composite",
      props: [],
      variants: [],
      a11y: {
        roles: ["region"],
        requiredAttributes: [],
        optionalAttributes: ["aria-label"],
        keyboardInteractions: [],
        focusManagement: "none",
        liveRegion: false,
        wcagCriteria: [],
      },
      dependencies: [],
      tags: [],
      provenance: {
        registry: "test",
        registryName: "accordion",
        fetchedAt: "2026-03-07T00:00:00.000Z",
      },
      generatedAt: "2026-03-07T00:00:00.000Z",
      irVersion: "1.0.0",
    };

    const emitter = new LitEmitter();
    const result = await emitter.emit({
      componentId: "accordion",
      framework: "lit",
      spec: { ir },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const file = result.data[0];
    expect(file).toBeDefined();
    if (!file) {
      return;
    }

    expect(file.content).toContain(
      '@property({ type: String }) type: "single" | "multiple" = "single";',
    );
    expect(file.content).toContain("private toggleItem(itemValue: string): void");
    expect(file.content).toContain(
      'this.dispatchEvent(new CustomEvent<string | string[]>("value-change"',
    );
    expect(file.content).toContain('data-component="accordion"');
  });
});
