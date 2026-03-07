import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { Transformer, TransformedComponent } from "@shadcnui-foundry/core";

export class SvelteTransformer implements Transformer {
  readonly framework = "svelte" as const;

  async transform(ir: ComponentIR): Promise<PipelineResult<TransformedComponent>> {
    return {
      success: true,
      data: { componentId: ir.id, framework: "svelte", spec: { ir } },
    };
  }
}
