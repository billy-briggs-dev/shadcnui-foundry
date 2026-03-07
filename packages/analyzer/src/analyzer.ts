import type { Analyzer, RawRegistryArtifact } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import { createLogger } from "@shadcnui-foundry/core";

/**
 * Analyzes a raw registry artifact and produces a ComponentIR.
 *
 * Walks the artifact's file list and extracts structural metadata
 * (props, variants) into the framework-neutral IR.
 *
 * TODO: implement AST-based prop/variant extraction as the IR schema matures.
 */
export class RegistryAnalyzer implements Analyzer {
  readonly name = "registry-analyzer";
  private readonly logger = createLogger("RegistryAnalyzer");

  async analyze(artifact: RawRegistryArtifact): Promise<PipelineResult<ComponentIR>> {
    this.logger.info("Analyzing artifact", { name: artifact.name });

    const now = new Date().toISOString();

    // Stub: return a minimal IR shell populated from the raw artifact metadata.
    // TODO: derive category, props, variants, a11y from AST analysis.
    const ir: ComponentIR = {
      id: artifact.name,
      name: artifact.name,
      description: "",
      category: "primitive",
      props: [],
      variants: [],
      a11y: { roles: [], keyboardInteractions: [], requiredAttributes: [], optionalAttributes: [], focusManagement: "none", liveRegion: false, wcagCriteria: [] },
      dependencies: [],
      tags: [],
      provenance: {
        registry: "shadcn/ui",
        registryName: artifact.name,
        fetchedAt: artifact.fetchedAt ?? now,
        sourceUrl: artifact.sourceUrl,
      },
      generatedAt: now,
      irVersion: "1.0.0",
    };

    return { success: true, data: ir };
  }
}
