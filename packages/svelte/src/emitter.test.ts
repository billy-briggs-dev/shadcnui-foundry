import type { ComponentIR } from "@shadcnui-foundry/ir";
import { describe, expect, it } from "vitest";
import { SvelteEmitter } from "./emitter.js";

describe("SvelteEmitter", () => {
  it("emits Svelte runes syntax with variant and a11y bindings", async () => {
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

    const emitter = new SvelteEmitter();
    const result = await emitter.emit({
      componentId: "button",
      framework: "svelte",
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

    expect(file.path).toBe("button/button.svelte");
    expect(file.content).toContain("let props: Props = $props();");
    expect(file.content).toContain("let propsWithDefaults = $derived");
    expect(file.content).toContain("let className = $derived");
    expect(file.content).toContain("data-variant={propsWithDefaults.variant}");
    expect(file.content).toContain('{aria-disabled}={propsWithDefaults["aria-disabled"]}');
    expect(file.content).toContain('role="button"');
    expect(file.content).toMatchSnapshot();
  });
});
