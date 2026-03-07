import type { PipelineResult } from "@shadcnui-foundry/ir";

/**
 * Raw artifact fetched from a registry before normalization.
 */
export type RawRegistryArtifact = {
  /** Component name in the source registry */
  name: string;
  /** Raw content (JSON, TS source, etc.) */
  content: string | Record<string, unknown>;
  /** Content type */
  contentType: "json" | "typescript" | "unknown";
  /** Source URL */
  sourceUrl?: string;
  /** Fetch timestamp */
  fetchedAt: string;
};

/**
 * Ingester interface — fetches raw component data from a registry source.
 * Implementations: ShadcnRegistryIngester, LocalFileIngester, MCPIngester
 */
export interface Ingester {
  readonly name: string;

  /**
   * Ingest a single component by name.
   */
  ingest(componentName: string): Promise<PipelineResult<RawRegistryArtifact>>;

  /**
   * List all available components in the registry.
   */
  list(): Promise<PipelineResult<string[]>>;
}
