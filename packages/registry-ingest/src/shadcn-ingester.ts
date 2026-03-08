import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import type { Ingester, RawRegistryArtifact } from "@shadcnui-foundry/core";
import { createLogger } from "@shadcnui-foundry/core";
import type { PipelineError, PipelineResult } from "@shadcnui-foundry/ir";
import { ArtifactCache } from "./cache.js";
import { ShadcnRegistryItemSchema } from "./schemas.js";

const SHADCN_REGISTRY_BASE = "https://ui.shadcn.com/registry";

export type ShadcnIngesterOptions = {
  baseUrl?: string;
  cacheDir?: string;
  /** If true, only use cache and never make network requests */
  offlineMode?: boolean;
  /** If true, CLI fallback is used when HTTP ingestion fails */
  enableCliFallback?: boolean;
  /** Custom fetch implementation for tests */
  fetchImpl?: typeof fetch;
  /** Custom CLI runner for tests */
  cliFallbackRunner?: (componentName: string, workspaceDir: string) => CliRunResult;
};

type CliRunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
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
  private readonly enableCliFallback: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly cliFallbackRunner: (componentName: string, workspaceDir: string) => CliRunResult;
  private readonly logger = createLogger("ShadcnIngester");

  constructor(options: ShadcnIngesterOptions = {}) {
    this.baseUrl = options.baseUrl ?? SHADCN_REGISTRY_BASE;
    this.cache = new ArtifactCache(options.cacheDir ?? ".foundry/cache");
    this.offlineMode = options.offlineMode ?? false;
    this.enableCliFallback = options.enableCliFallback ?? true;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.cliFallbackRunner = options.cliFallbackRunner ?? runShadcnCliFallback;
  }

  private buildCliFallbackArtifact(componentName: string): PipelineResult<RawRegistryArtifact> {
    const workspaceDir = mkdtempSync(join(tmpdir(), "foundry-shadcn-cli-"));

    try {
      writeShadcnCliScaffold(workspaceDir);

      const cliResult = this.cliFallbackRunner(componentName, workspaceDir);
      if (cliResult.status !== 0) {
        return {
          success: false,
          errors: [
            {
              code: "CLI_FALLBACK_FAILED",
              message: `shadcn CLI failed for ${componentName}`,
              context: {
                status: cliResult.status,
                stderr: cliResult.stderr,
                stdout: cliResult.stdout,
                error: cliResult.error?.message,
              },
            },
          ],
        };
      }

      const files = collectInstalledComponentFiles(workspaceDir);
      if (files.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: "CLI_FALLBACK_PARSE_ERROR",
              message: `shadcn CLI completed but no component files were detected for ${componentName}`,
            },
          ],
        };
      }

      const raw = {
        name: componentName,
        type: "registry:ui",
        files,
      };

      const parsed = ShadcnRegistryItemSchema.safeParse(raw);
      if (!parsed.success) {
        return {
          success: false,
          errors: parsed.error.errors.map((error) => ({
            code: "SCHEMA_VALIDATION_ERROR",
            message: error.message,
            path: error.path.join("."),
          })),
        };
      }

      const artifact: RawRegistryArtifact = {
        name: componentName,
        content: parsed.data,
        contentType: "json",
        sourceUrl: `shadcn-cli://add/${componentName}`,
        fetchedAt: new Date().toISOString(),
      };

      this.cache.set("shadcn", componentName, artifact);

      return { success: true, data: artifact };
    } finally {
      rmSync(workspaceDir, { recursive: true, force: true });
    }
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

    let raw: unknown | undefined;
    let fetchError: PipelineError | undefined;
    try {
      const response = await this.fetchImpl(url);
      if (!response.ok) {
        fetchError = {
          code: "FETCH_ERROR",
          message: `Registry returned ${response.status} for ${componentName}`,
          context: { url, status: response.status },
        };
      } else {
        raw = await response.json();
      }
    } catch (err) {
      fetchError = {
        code: "NETWORK_ERROR",
        message: `Failed to fetch ${componentName}: ${String(err)}`,
        context: { url },
      };
    }

    if (raw === undefined && this.enableCliFallback) {
      this.logger.warn("HTTP ingest failed, attempting shadcn CLI fallback", {
        component: componentName,
        reason: fetchError?.code ?? "UNKNOWN",
      });

      const fallbackResult = this.buildCliFallbackArtifact(componentName);
      if (fallbackResult.success) {
        this.logger.info("CLI fallback ingestion complete", { component: componentName });
        return fallbackResult;
      }

      return {
        success: false,
        errors: [...(fetchError ? [fetchError] : []), ...fallbackResult.errors],
      };
    }

    if (raw === undefined) {
      return {
        success: false,
        errors: [
          fetchError ?? {
            code: "FETCH_ERROR",
            message: `Failed to fetch ${componentName}`,
            context: { url },
          },
        ],
      };
    }

    // Validate the fetched data
    const parsed = ShadcnRegistryItemSchema.safeParse(raw);
    if (!parsed.success) {
      if (this.enableCliFallback) {
        this.logger.warn("HTTP payload schema validation failed, attempting CLI fallback", {
          component: componentName,
        });

        const fallbackResult = this.buildCliFallbackArtifact(componentName);
        if (fallbackResult.success) {
          this.logger.info("CLI fallback ingestion complete", { component: componentName });
          return fallbackResult;
        }
      }

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

function runShadcnCliFallback(componentName: string, workspaceDir: string): CliRunResult {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const args = ["dlx", "shadcn@latest", "add", componentName, "--yes", "--overwrite"];
  const result = spawnSync(command, args, {
    cwd: workspaceDir,
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...(result.error ? { error: result.error } : {}),
  };
}

function writeShadcnCliScaffold(workspaceDir: string): void {
  mkdirSync(resolve(workspaceDir, "src", "components", "ui"), { recursive: true });
  mkdirSync(resolve(workspaceDir, "src", "lib"), { recursive: true });
  mkdirSync(resolve(workspaceDir, "src", "styles"), { recursive: true });

  writeFileSync(
    resolve(workspaceDir, "package.json"),
    JSON.stringify(
      {
        name: "foundry-shadcn-cli-fallback",
        private: true,
        version: "0.0.0",
        type: "module",
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  writeFileSync(
    resolve(workspaceDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"],
          },
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  writeFileSync(
    resolve(workspaceDir, "components.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "new-york",
        rsc: false,
        tsx: true,
        tailwind: {
          config: "tailwind.config.ts",
          css: "src/styles/globals.css",
          baseColor: "slate",
          cssVariables: true,
          prefix: "",
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
          hooks: "@/hooks",
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  writeFileSync(resolve(workspaceDir, "tailwind.config.ts"), "export default {};\n", "utf8");
  writeFileSync(resolve(workspaceDir, "src", "styles", "globals.css"), "@tailwind base;\n", "utf8");
}

function collectInstalledComponentFiles(workspaceDir: string): Array<{
  path: string;
  content: string;
  type: string;
}> {
  const roots = [
    resolve(workspaceDir, "src", "components", "ui"),
    resolve(workspaceDir, "components", "ui"),
    resolve(workspaceDir, "src", "lib"),
    resolve(workspaceDir, "lib"),
  ];

  const allowExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
  const files: Array<{ path: string; content: string; type: string }> = [];

  for (const root of roots) {
    if (!existsDirectory(root)) {
      continue;
    }

    walkFiles(root, (filePath) => {
      const extension = extname(filePath).toLowerCase();
      if (!allowExtensions.has(extension)) {
        return;
      }

      const content = readFileSync(filePath, "utf8");
      const relativePath = relative(workspaceDir, filePath).split("\\").join("/");
      files.push({
        path: relativePath,
        content,
        type: "registry:ui",
      });
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function walkFiles(dirPath: string, onFile: (filePath: string) => void): void {
  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkFiles(fullPath, onFile);
      continue;
    }

    if (stats.isFile()) {
      onFile(fullPath);
    }
  }
}

function existsDirectory(pathname: string): boolean {
  try {
    return statSync(pathname).isDirectory();
  } catch {
    return false;
  }
}
