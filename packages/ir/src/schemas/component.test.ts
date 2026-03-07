import { describe, it, expect } from "vitest";
import { ComponentIRSchema } from "./component.js";

describe("ComponentIRSchema", () => {
  it("validates a minimal valid component IR", () => {
    const result = ComponentIRSchema.safeParse({
      id: "button",
      name: "Button",
      description: "A clickable button component",
      category: "primitive",
      props: [],
      variants: [],
      a11y: {
        roles: ["button"],
        requiredAttributes: [],
        optionalAttributes: ["aria-disabled"],
        keyboardInteractions: [
          { key: "Enter", description: "Activates the button" },
          { key: "Space", description: "Activates the button" },
        ],
        focusManagement: "none",
        liveRegion: false,
        wcagCriteria: ["2.1.1", "4.1.2"],
      },
      dependencies: [],
      tags: ["interactive", "form"],
      provenance: {
        registry: "shadcn/ui",
        registryName: "button",
        fetchedAt: new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid component id formats", () => {
    const result = ComponentIRSchema.safeParse({
      id: "Button Component", // Invalid: spaces and uppercase
      name: "Button",
      description: "A button",
      category: "primitive",
      props: [],
      variants: [],
      a11y: {
        roles: [],
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [],
        wcagCriteria: [],
      },
      dependencies: [],
      tags: [],
      provenance: {
        registry: "shadcn/ui",
        registryName: "button",
        fetchedAt: new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it("requires provenance metadata", () => {
    const result = ComponentIRSchema.safeParse({
      id: "button",
      name: "Button",
      description: "A button",
      category: "primitive",
      props: [],
      variants: [],
      a11y: {
        roles: [],
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [],
        wcagCriteria: [],
      },
      dependencies: [],
      tags: [],
      // provenance intentionally omitted
      generatedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });
});
