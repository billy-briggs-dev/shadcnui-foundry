import type { TransformedComponent, Transformer } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";

export class SvelteTransformer implements Transformer {
  readonly framework = "svelte" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: { componentId: ir.id, framework: "svelte", spec: { ir } },
    };
  }
}
