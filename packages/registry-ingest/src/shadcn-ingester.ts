import type { Ingester, RawRegistryArtifact } from "@shadcnui-foundry/core";
import { createLogger } from "@shadcnui-foundry/core";
import type { PipelineResult } from "@shadcnui-foundry/ir";
import { ArtifactCache } from "./cache.js";
import { ShadcnRegistryItemSchema } from "./schemas.js";

const SHADCN_REGISTRY_BASE = "https://ui.shadcn.com/registry";

export type ShadcnIngesterOptions = {
  baseUrl?: string;
  cacheDir?: string;
  /** If true, only use cache and never make network requests */
  offlineMode?: boolean;
};

/**
 * Ingests components from the shadcn/ui public registry API.
 *
 * Artifacts are cached locally for offline regeneration.
 * Fetched data is validated against ShadcnRegistryItemSchema before returning.
 */
export class ShadcnRegistryIngester implements Ingester {
  readonly name = "shadcn-registry";
  private readonly baseUrl: string;
  private readonly cache: ArtifactCache;
  private readonly offlineMode: boolean;
  private readonly logger = createLogger("ShadcnIngester");

  constructor(options: ShadcnIngesterOptions = {}) {
    this.baseUrl = options.baseUrl ?? SHADCN_REGISTRY_BASE;
    this.cache = new ArtifactCache(options.cacheDir ?? ".foundry/cache");
    this.offlineMode = options.offlineMode ?? false;
  }

  private listUrls(): string[] {
    const candidates = [`${this.baseUrl}/index.json`];

    if (this.baseUrl.includes("/r/styles/")) {
      try {
        const parsed = new URL(this.baseUrl);
        candidates.push(`${parsed.origin}/r/index.json`);
      } catch {
        // Ignore malformed custom base URLs.
      }
    }

    return [...new Set(candidates)];
  }

  private extractNamesFromIndex(data: unknown): string[] {
    if (Array.isArray(data)) {
      return data
        .filter((entry): entry is { name?: unknown } => typeof entry === "object" && entry !== null)
        .map((entry) => entry.name)
        .filter((name): name is string => typeof name === "string");
    }

    if (typeof data === "object" && data !== null && "items" in data) {
      const maybeItems = (data as { items?: unknown }).items;
      if (Array.isArray(maybeItems)) {
        return maybeItems
          .filter(
            (entry): entry is { name?: unknown } => typeof entry === "object" && entry !== null,
          )
          .map((entry) => entry.name)
          .filter((name): name is string => typeof name === "string");
      }
    }

    return [];
  }

  async ingest(componentName: string): Promise<PipelineResult<RawRegistryArtifact>> {
    const cacheKey = componentName;
    const cached = this.cache.get<RawRegistryArtifact>("shadcn", cacheKey);

    if (cached) {
      this.logger.debug("Cache hit", { component: componentName });
      return { success: true, data: cached };
    }

    if (this.offlineMode) {
      return {
        success: false,
        errors: [
          {
            code: "OFFLINE_CACHE_MISS",
            message: `Offline mode: no cached artifact for "${componentName}"`,
          },
        ],
      };
    }

    const url = `${this.baseUrl}/${componentName}.json`;
    this.logger.info("Fetching from registry", { url });

    let raw: unknown;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return {
          success: false,
          errors: [
            {
              code: "FETCH_ERROR",
              message: `Registry returned ${response.status} for ${componentName}`,
              context: { url, status: response.status },
            },
          ],
        };
      }
      raw = await response.json();
    } catch (err) {
      return {
        success: false,
        errors: [
          {
            code: "NETWORK_ERROR",
            message: `Failed to fetch ${componentName}: ${String(err)}`,
            context: { url },
          },
        ],
      };
    }

    // Validate the fetched data
    const parsed = ShadcnRegistryItemSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((e) => ({
          code: "SCHEMA_VALIDATION_ERROR",
          message: e.message,
          path: e.path.join("."),
        })),
      };
    }

    const artifact: RawRegistryArtifact = {
      name: componentName,
      content: parsed.data,
      contentType: "json",
      sourceUrl: url,
      fetchedAt: new Date().toISOString(),
    };

    this.cache.set("shadcn", cacheKey, artifact);
    return { success: true, data: artifact };
  }

  async list(): Promise<PipelineResult<string[]>> {
    const cached = this.cache.get<string[]>("shadcn", "__index__");
    if (cached && cached.length > 0) {
      return { success: true, data: cached };
    }

    if (this.offlineMode) {
      return {
        success: false,
        errors: [{ code: "OFFLINE_CACHE_MISS", message: "Offline mode: no cached index" }],
      };
    }

    const urls = this.listUrls();
    let lastError: { code: string; message: string } | null = null;

    for (const url of urls) {
      this.logger.info("Fetching registry index", { url });

      try {
        const response = await fetch(url);
        if (!response.ok) {
          lastError = { code: "FETCH_ERROR", message: `Index returned ${response.status}` };
          continue;
        }

        const data: unknown = await response.json();
        const names = this.extractNamesFromIndex(data);

        if (names.length > 0) {
          this.cache.set("shadcn", "__index__", names);
          return { success: true, data: names };
        }

        lastError = {
          code: "INDEX_PARSE_ERROR",
          message: `Index response at ${url} did not include component names`,
        };
      } catch (err) {
        lastError = { code: "NETWORK_ERROR", message: String(err) };
      }
    }

    return {
      success: false,
      errors: [
        {
          code: lastError?.code ?? "INDEX_ERROR",
          message: lastError?.message ?? "Failed to fetch registry index",
        },
      ],
    };
  }
}
