import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type { GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";
import { getAngularEmitContext, resolveAngularEmitStrategy } from "./emitter-strategies.js";

export class AngularRenderer implements Emitter {
  readonly framework = "angular";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const context = getAngularEmitContext(transformed);
    const strategy = resolveAngularEmitStrategy(transformed.componentId);
    return strategy(context);
  }
}
