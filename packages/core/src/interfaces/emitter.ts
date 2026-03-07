import type { GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";
import type { TransformedComponent } from "./transformer.js";

/**
 * Emitter interface — converts a transformed component spec into source files.
 * This is the emit stage of the pipeline.
 */
export interface Emitter {
  readonly framework: string;

  /**
   * Emit source files from a transformed component.
   */
  emit(
    transformed: TransformedComponent
  ): Promise<PipelineResult<GeneratedFile[]>>;
}
