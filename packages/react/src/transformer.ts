import type { TransformedComponent, Transformer } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult, Prop, Variant } from "@shadcnui-foundry/ir";

type ReactPropSpec = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
};

type ReactA11ySpec = {
  roles: string[];
  requiredAttributes: string[];
  optionalAttributes: string[];
};

type ReactComponentSpec = {
  componentName: string;
  propsInterface: ReactPropSpec[];
  variants: Variant[];
  a11y: ReactA11ySpec;
  category: ComponentIR["category"];
};

/**
 * Transforms a ComponentIR into a React-specific intermediate form.
 *
 * Produces a spec that the ReactEmitter uses to generate TSX source files.
 */
export class ReactTransformer implements Transformer {
  readonly framework = "react" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    // Map IR props to React prop types
    const propsInterface: ReactPropSpec[] = ir.props.map((p) => ({
      name: p.name,
      type: this.mapPropType(p),
      required: p.required,
      ...(p.defaultValue !== undefined && { defaultValue: p.defaultValue }),
      ...(p.description !== undefined && { description: p.description }),
    }));

    const spec: ReactComponentSpec = {
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

    return { success: true, data: { componentId: ir.id, framework: "react", spec } };
  }

  private mapPropType(prop: Prop): string {
    const { type, values } = prop;

    if ((type === "enum" || type === "union") && values && values.length > 0) {
      return values.map((v) => `"${v}"`).join(" | ");
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
      case "node":
        return "React.ReactNode";
      case "ref":
        return "React.Ref<unknown>";
      case "function":
        return "(...args: unknown[]) => unknown";
      case "enum":
      case "union":
        return "unknown";
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
