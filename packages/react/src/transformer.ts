import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { Transformer, TransformedComponent } from "@shadcnui-foundry/core";

/**
 * Transforms a ComponentIR into a React-specific intermediate form.
 *
 * Produces a spec that the ReactEmitter uses to generate TSX source files.
 */
export class ReactTransformer implements Transformer {
  readonly framework = "react" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    // Map IR props to React prop types
    const propsInterface = ir.props.map((p) => ({
      name: p.name,
      type: this.mapPropType(p.type, p.values),
      required: p.required,
      defaultValue: p.defaultValue,
      description: p.description,
    }));

    const spec = {
      componentName: this.toPascalCase(ir.id),
      propsInterface,
      variants: ir.variants,
      a11y: ir.a11y,
      category: ir.category,
    };

    return { success: true, data: { componentId: ir.id, framework: "react", spec } };
  }

  private mapPropType(type: string, values?: string[]): string {
    switch (type) {
      case "string": return "string";
      case "number": return "number";
      case "boolean": return "boolean";
      case "enum": return values ? values.map((v) => `"${v}"`).join(" | ") : "string";
      case "node": return "React.ReactNode";
      case "ref": return "React.Ref<HTMLElement>";
      case "function": return "(...args: unknown[]) => unknown";
      default: return "unknown";
    }
  }

  private toPascalCase(id: string): string {
    return id.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  }
}
