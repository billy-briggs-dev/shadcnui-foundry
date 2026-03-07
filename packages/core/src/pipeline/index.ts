import type { FrameworkTarget, GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";
import type { Analyzer } from "../interfaces/analyzer.js";
import type { Emitter } from "../interfaces/emitter.js";
import type { Ingester } from "../interfaces/ingester.js";
import type { Transformer } from "../interfaces/transformer.js";

export type PipelineConfig = {
  ingester: Ingester;
  analyzer: Analyzer;
  transformers: Map<FrameworkTarget, Transformer>;
  emitters: Map<FrameworkTarget, Emitter>;
  targets: FrameworkTarget[];
};

export type PipelineRunResult = {
  componentId: string;
  framework: FrameworkTarget;
  files: GeneratedFile[];
};

/**
 * Orchestrates the full ingest → analyze → transform → emit pipeline.
 * Each stage is independently replaceable via the interface contracts.
 */
export class Pipeline {
  constructor(private readonly config: PipelineConfig) {}

  async run(componentName: string): Promise<PipelineResult<PipelineRunResult[]>> {
    // Stage 1: Ingest
    const ingestResult = await this.config.ingester.ingest(componentName);
    if (!ingestResult.success) {
      return { success: false, errors: ingestResult.errors };
    }

    // Stage 2: Analyze
    const analyzeResult = await this.config.analyzer.analyze(ingestResult.data);
    if (!analyzeResult.success) {
      return { success: false, errors: analyzeResult.errors };
    }

    const ir = analyzeResult.data;
    const results: PipelineRunResult[] = [];

    // Stage 3 + 4: Transform + Emit for each target
    for (const target of this.config.targets) {
      const transformer = this.config.transformers.get(target);
      const emitter = this.config.emitters.get(target);

      if (!transformer || !emitter) {
        return {
          success: false,
          errors: [
            {
              code: "MISSING_TRANSFORMER",
              message: `No transformer/emitter for target: ${target}`,
            },
          ],
        };
      }

      const transformResult = await transformer.transform(ir);
      if (!transformResult.success) {
        return { success: false, errors: transformResult.errors };
      }

      const emitResult = await emitter.emit(transformResult.data);
      if (!emitResult.success) {
        return { success: false, errors: emitResult.errors };
      }

      results.push({ componentId: ir.id, framework: target, files: emitResult.data });
    }

    return { success: true, data: results };
  }
}
