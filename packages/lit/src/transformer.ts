import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { Transformer, TransformedComponent } from "@shadcnui-foundry/core";

export class LitTransformer implements Transformer {
  readonly framework = "lit" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: { componentId: ir.id, framework: "lit", spec: { ir } },
    };
  }
}
