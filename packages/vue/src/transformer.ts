import type { TransformedComponent, Transformer } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";

export class VueTransformer implements Transformer {
  readonly framework = "vue" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: {
        componentId: ir.id,
        framework: "vue",
        spec: { componentName: this.toPascalCase(ir.id), ir },
      },
    };
  }

  private toPascalCase(id: string): string {
    return id
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
  }
}
