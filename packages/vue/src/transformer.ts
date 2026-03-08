import type { TransformedComponent, Transformer } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult, Prop, Variant } from "@shadcnui-foundry/ir";

type VuePropSpec = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
};

type VueA11ySpec = {
  roles: string[];
  requiredAttributes: string[];
  optionalAttributes: string[];
};

type VueComponentSpec = {
  componentName: string;
  propsInterface: VuePropSpec[];
  variants: Variant[];
  a11y: VueA11ySpec;
  category: ComponentIR["category"];
};

export class VueTransformer implements Transformer {
  readonly framework = "vue" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    const propsInterface: VuePropSpec[] = ir.props.map((prop) => ({
      name: prop.name,
      type: this.mapPropType(prop),
      required: prop.required,
      ...(prop.defaultValue !== undefined && { defaultValue: prop.defaultValue }),
      ...(prop.description !== undefined && { description: prop.description }),
    }));

    const spec: VueComponentSpec = {
      componentName: this.toPascalCase(ir.id),
      propsInterface,
      variants: ir.variants,
      a11y: {
        roles: ir.a11y.roles,
        requiredAttributes: ir.a11y.requiredAttributes,
        optionalAttributes: ir.a11y.optionalAttributes,
      },
      category: ir.category,
    };

    return {
      success: true,
      data: {
        componentId: ir.id,
        framework: "vue",
        spec,
      },
    };
  }

  private mapPropType(prop: Prop): string {
    const { type, values } = prop;

    if ((type === "enum" || type === "union") && values && values.length > 0) {
      return values.map((value) => `"${value}"`).join(" | ");
    }

    switch (type) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        return "unknown[]";
      case "object":
        return "Record<string, unknown>";
      case "function":
        return "(...args: unknown[]) => unknown";
      default:
        return "unknown";
    }
  }

  private toPascalCase(id: string): string {
    return id
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
  }
}
