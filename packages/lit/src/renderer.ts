import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type { GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";
import { getLitEmitContext, resolveLitEmitStrategy } from "./emitter-strategies.js";

export class LitRenderer implements Emitter {
  readonly framework = "lit";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const context = getLitEmitContext(transformed);
    const strategy = resolveLitEmitStrategy(transformed.componentId);
    return strategy(context);
  }
}
