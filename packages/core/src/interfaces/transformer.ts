import type { ComponentIR, FrameworkTarget, PipelineResult } from "@shadcnui-foundry/ir";

/**
 * Framework-specific intermediate output before final code emission.
 */
export type TransformedComponent = {
  componentId: string;
  framework: FrameworkTarget;
  /** Transformed component specification ready for emission */
  spec: Record<string, unknown>;
};

/**
 * Transformer interface — adapts a ComponentIR for a specific framework.
 * This is the transform stage of the pipeline.
 */
export interface Transformer {
  readonly framework: FrameworkTarget;

  /**
   * Transform a ComponentIR into a framework-specific intermediate form.
   */
  transform(
    ir: ComponentIR
  ): Promise<PipelineResult<TransformedComponent>>;
}
