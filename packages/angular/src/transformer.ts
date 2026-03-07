import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { Transformer, TransformedComponent } from "@shadcnui-foundry/core";

export class AngularTransformer implements Transformer {
  readonly framework = "angular" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: { componentId: ir.id, framework: "angular", spec: { ir } },
    };
  }
}
