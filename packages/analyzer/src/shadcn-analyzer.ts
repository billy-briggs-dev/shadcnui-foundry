import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { Analyzer, RawRegistryArtifact } from "@shadcnui-foundry/core";
import { ComponentIRSchema } from "@shadcnui-foundry/ir";
import { classifyComponent } from "./category-classifier.js";

/**
 * Analyzes a raw shadcn/ui registry artifact into a ComponentIR.
 *
 * This is the normalize stage: raw JSON → validated IR.
 */
export class ShadcnAnalyzer implements Analyzer {
  readonly name = "shadcn-analyzer";

  async analyze(artifact: RawRegistryArtifact): Promise<PipelineResult<ComponentIR>> {
    const raw = artifact.content as {
      name: string;
      description?: string;
      dependencies?: string[];
      registryDependencies?: string[];
    };

    const now = new Date().toISOString();

    const irData = {
      id: raw.name,
      name: this.toDisplayName(raw.name),
      description: raw.description ?? `The ${raw.name} component.`,
      category: classifyComponent(raw.name),
      props: [], // TODO: parse from TS source in files array
      variants: [], // TODO: parse from class-variance-authority calls
      a11y: {
        roles: this.inferRoles(raw.name),
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [],
        focusManagement: "none" as const,
        liveRegion: false,
        wcagCriteria: [],
      },
      dependencies: raw.registryDependencies ?? [],
      tags: [],
      provenance: {
        registry: "shadcn/ui",
        registryName: raw.name,
        fetchedAt: artifact.fetchedAt,
        sourceUrl: artifact.sourceUrl,
      },
      generatedAt: now,
    };

    const parsed = ComponentIRSchema.safeParse(irData);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((e) => ({
          code: "IR_VALIDATION_ERROR",
          message: e.message,
          path: e.path.join("."),
        })),
      };
    }

    return { success: true, data: parsed.data };
  }

  private toDisplayName(name: string): string {
    return name
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }

  private inferRoles(name: string): string[] {
    const roleMap: Record<string, string[]> = {
      button: ["button"],
      dialog: ["dialog"],
      alert: ["alert"],
      "alert-dialog": ["alertdialog"],
      checkbox: ["checkbox"],
      input: ["textbox"],
      select: ["listbox"],
      "radio-group": ["radiogroup"],
      slider: ["slider"],
      switch: ["switch"],
      tabs: ["tablist"],
      tooltip: ["tooltip"],
      "navigation-menu": ["navigation"],
      breadcrumb: ["navigation"],
    };
    return roleMap[name] ?? [];
  }
}
