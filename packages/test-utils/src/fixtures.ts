import type { ComponentIR } from "@shadcnui-foundry/ir";

/**
 * Creates a minimal valid ComponentIR for use in tests.
 * Merges provided overrides with sensible defaults.
 */
export function createTestComponentIR(overrides: Partial<ComponentIR> = {}): ComponentIR {
  return {
    id: "test-component",
    name: "TestComponent",
    description: "A test component",
    category: "primitive",
    props: [],
    variants: [],
    a11y: {
      roles: ["button"],
      requiredAttributes: [],
      optionalAttributes: [],
      keyboardInteractions: [
        { key: "Enter", description: "Activates" },
        { key: "Space", description: "Activates" },
      ],
      focusManagement: "none",
      liveRegion: false,
      wcagCriteria: [],
    },
    dependencies: [],
    tags: [],
    provenance: {
      registry: "test",
      registryName: "test-component",
      fetchedAt: "2024-01-01T00:00:00.000Z",
    },
    generatedAt: "2024-01-01T00:00:00.000Z",
    irVersion: "1.0.0",
    ...overrides,
  };
}

/**
 * A pre-built Button ComponentIR fixture.
 */
export const BUTTON_IR: ComponentIR = createTestComponentIR({
  id: "button",
  name: "Button",
  description: "A clickable button component",
  category: "primitive",
  props: [
    {
      name: "variant",
      type: "enum",
      values: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      required: false,
      defaultValue: '"default"',
      description: "Visual style variant",
      forwarded: false,
    },
    {
      name: "size",
      type: "enum",
      values: ["default", "sm", "lg", "icon"],
      required: false,
      defaultValue: '"default"',
      description: "Size variant",
      forwarded: false,
    },
    {
      name: "disabled",
      type: "boolean",
      required: false,
      defaultValue: "false",
      forwarded: true,
    },
    {
      name: "children",
      type: "node",
      required: false,
      description: "Button content",
      forwarded: false,
    },
  ],
  variants: [
    {
      name: "variant",
      values: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      defaultValue: "default",
      strategy: "class",
    },
    {
      name: "size",
      values: ["default", "sm", "lg", "icon"],
      defaultValue: "default",
      strategy: "class",
    },
  ],
  a11y: {
    roles: ["button"],
    requiredAttributes: [],
    optionalAttributes: ["aria-disabled", "aria-pressed", "aria-expanded"],
    keyboardInteractions: [
      { key: "Enter", description: "Activates the button" },
      { key: "Space", description: "Activates the button" },
    ],
    focusManagement: "none",
    liveRegion: false,
    wcagCriteria: ["2.1.1", "2.4.7", "4.1.2"],
  },
});
