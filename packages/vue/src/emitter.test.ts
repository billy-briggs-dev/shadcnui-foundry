import type { TransformedComponent } from "@shadcnui-foundry/core";
import { describe, expect, it } from "vitest";
import { VueEmitter } from "./emitter.js";

describe("VueEmitter", () => {
  it("emits SFC using defineProps, defineEmits, and useAttrs", async () => {
    const transformed: TransformedComponent = {
      componentId: "button",
      framework: "vue",
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

    const emitter = new VueEmitter();
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

    expect(file.path).toBe("button/Button.vue");
    expect(file.content).toContain("withDefaults(defineProps<ButtonProps>()");
    expect(file.content).toContain("const emit = defineEmits");
    expect(file.content).toContain("const attrs = useAttrs()");
    expect(file.content).toContain(':data-variant="props.variant"');
    expect(file.content).toContain(':aria-disabled="props["aria-disabled"]"');
    expect(file.content).toContain('role="button"');
    expect(file.content).toMatchSnapshot();
  });

  it("emits overlay behavior with Teleport and keyboard handling for dialog", async () => {
    const transformed: TransformedComponent = {
      componentId: "dialog",
      framework: "vue",
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

    const emitter = new VueEmitter();
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

    expect(file.content).toContain(
      'import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";',
    );
    expect(file.content).toContain('<Teleport to="body">');
    expect(file.content).toContain("function onDocumentKeydown(event: KeyboardEvent): void");
    expect(file.content).toContain('if (event.key === "Escape")');
  });
});
