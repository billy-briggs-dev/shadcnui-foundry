import type { TransformedComponent, Transformer } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";

export class LitTransformer implements Transformer {
  readonly framework = "lit" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: { componentId: ir.id, framework: "lit", spec: { ir } },
    };
  }
}
