import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { RawRegistryArtifact } from "./ingester.js";

/**
 * Analyzer interface — converts raw registry artifacts into normalized ComponentIR.
 * This is the normalize stage of the pipeline.
 */
export interface Analyzer {
  readonly name: string;

  /**
   * Analyze a raw artifact and produce a ComponentIR.
   */
  analyze(artifact: RawRegistryArtifact): Promise<PipelineResult<ComponentIR>>;
}
