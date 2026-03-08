import type { ComponentIR } from "@shadcnui-foundry/ir";
import { describe, expect, it } from "vitest";
import { AngularEmitter } from "./emitter.js";

describe("AngularEmitter", () => {
  it("emits typed @Input fields from IR props and variants", async () => {
    const ir: ComponentIR = {
      id: "button",
      name: "Button",
      description: "A button",
      category: "primitive",
      props: [
        {
          name: "asChild",
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
        optionalAttributes: [],
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

    const emitter = new AngularEmitter();
    const result = await emitter.emit({
      componentId: "button",
      framework: "angular",
      spec: { ir },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toHaveLength(1);
    const output = result.data[0];
    expect(output).toBeDefined();
    if (!output) {
      return;
    }

    expect(output.path).toBe("button/button.component.ts");
    expect(output.content).toContain('import { Component, Input } from "@angular/core";');
    expect(output.content).toContain("@Input() asChild?: boolean = false;");
    expect(output.content).toContain('@Input() variant?: "default" | "outline" = "default";');
    expect(output.content).toMatchSnapshot();
  });
});
