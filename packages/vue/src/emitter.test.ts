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
});
