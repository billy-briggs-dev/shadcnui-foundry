import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "@shadcnui-foundry/core";
import type { PipelineError, PipelineResult } from "@shadcnui-foundry/ir";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { runJobsCreate } from "./jobs-create.js";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

const logger = createLogger("CLI:jobs-create-all");
const DEFAULT_FRAMEWORKS = ["react", "vue", "svelte", "angular", "lit"] as const;
type Framework = (typeof DEFAULT_FRAMEWORKS)[number];

type JobsCreateAllOptions = {
  frameworks: string;
  offline?: boolean;
  cacheDir: string;
  baseUrl?: string;
  outDir: string;
  sharedCache: boolean;
  force?: boolean;
  failFast?: boolean;
  limit?: string;
};

function parseFrameworks(raw: string): PipelineResult<Framework[]> {
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is Framework => DEFAULT_FRAMEWORKS.includes(value as Framework));

  if (values.length === 0) {
    return {
      success: false,
      errors: [
        {
          code: "INVALID_FRAMEWORKS",
          message: `No valid frameworks provided. Supported values: ${DEFAULT_FRAMEWORKS.join(", ")}`,
        },
      ],
    };
  }

  return { success: true, data: [...new Set(values)] };
}

function parseLimit(raw: string | undefined): PipelineResult<number | null> {
  if (!raw) {
    return { success: true, data: null };
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return {
      success: false,
      errors: [
        {
          code: "INVALID_LIMIT",
          message: "--limit must be a positive integer",
        },
      ],
    };
  }

  return { success: true, data: parsed };
}

function hasBundle(baseOutDir: string, framework: string, component: string): boolean {
  const runDir = resolve(process.cwd(), baseOutDir, framework, component);
  return (
    existsSync(resolve(runDir, "artifact.json")) &&
    existsSync(resolve(runDir, "ir.json")) &&
    existsSync(resolve(runDir, "prompt.md"))
  );
}

function hasSharedInput(baseOutDir: string, component: string): boolean {
  const runDir = resolve(process.cwd(), baseOutDir, "_shared", component);
  return existsSync(resolve(runDir, "artifact.json")) && existsSync(resolve(runDir, "ir.json"));
}

async function listComponentsWithFallback(
  options: Pick<JobsCreateAllOptions, "cacheDir" | "offline" | "baseUrl">,
): Promise<PipelineResult<string[]>> {
  const baseUrls = resolveRegistryBaseUrls(options.baseUrl);

  for (let index = 0; index < baseUrls.length; index += 1) {
    const baseUrl = baseUrls[index];
    if (!baseUrl) {
      continue;
    }

    const ingester = new ShadcnRegistryIngester({
      ...(options.offline !== undefined && { offlineMode: options.offline }),
      cacheDir: options.cacheDir,
      baseUrl,
    });

    const result = await ingester.list();
    if (result.success) {
      logger.info("Resolved component index", { componentCount: result.data.length, baseUrl });
      return result;
    }

    for (const error of result.errors) {
      logger.error(error.message, { code: error.code, baseUrl });
    }

    const hasNext = index < baseUrls.length - 1;
    if (hasNext) {
      logger.warn("List failed on endpoint, trying fallback", {
        failedBaseUrl: baseUrl,
        nextBaseUrl: baseUrls[index + 1] ?? null,
      });
    }
  }

  return {
    success: false,
    errors: [
      {
        code: "LIST_FAILED",
        message: "Unable to list components from any configured endpoint",
      },
    ],
  };
}

function logErrors(errors: PipelineError[]): void {
  for (const error of errors) {
    logger.error(error.message, { code: error.code, path: error.path, context: error.context });
  }
}

export function jobsCreateAllCommand(): Command {
  return new Command("jobs-create-all")
    .description("Create job bundles for all components across selected frameworks")
    .option(
      "-f, --frameworks <list>",
      "Comma-separated framework targets",
      DEFAULT_FRAMEWORKS.join(","),
    )
    .option("--offline", "Use cached artifacts only")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .option("--out-dir <dir>", "Output directory", ".foundry/agent-jobs")
    .option("--shared-cache", "Use shared artifact/ir cache for faster multi-framework runs", true)
    .option("--no-shared-cache", "Disable shared artifact/ir cache")
    .option("--force", "Regenerate even if bundle files already exist")
    .option("--fail-fast", "Stop on first failure")
    .option("--limit <n>", "Process only first N components")
    .action(async (options: JobsCreateAllOptions) => {
      const frameworksResult = parseFrameworks(options.frameworks);
      if (!frameworksResult.success) {
        logErrors(frameworksResult.errors);
        process.exit(1);
      }

      const limitResult = parseLimit(options.limit);
      if (!limitResult.success) {
        logErrors(limitResult.errors);
        process.exit(1);
      }

      const listed = await listComponentsWithFallback(options);
      if (!listed.success) {
        logErrors(listed.errors);
        process.exit(1);
      }

      const frameworks = frameworksResult.data;
      const primaryFramework = frameworks[0];
      if (!primaryFramework) {
        logErrors([
          {
            code: "INVALID_FRAMEWORKS",
            message: "No frameworks selected for jobs-create-all",
          },
        ]);
        process.exit(1);
      }

      const limit = limitResult.data;
      const components = limit ? listed.data.slice(0, limit) : listed.data;

      let generated = 0;
      let skipped = 0;
      const failures: Array<{ component: string; framework: string; errors: PipelineError[] }> = [];

      for (const component of components) {
        const sharedInputDir = `${options.outDir}/_shared`;

        if (options.sharedCache) {
          const sharedExists = hasSharedInput(options.outDir, component);
          if (!sharedExists || options.force) {
            const sharedResult = await runJobsCreate(component, {
              framework: primaryFramework,
              cacheDir: options.cacheDir,
              ...(options.offline !== undefined && { offline: options.offline }),
              ...(options.baseUrl !== undefined && { baseUrl: options.baseUrl }),
              outDir: sharedInputDir,
            });

            if (!sharedResult.success) {
              failures.push({ component, framework: "_shared", errors: sharedResult.errors });
              logErrors(sharedResult.errors);
              if (options.failFast) {
                break;
              }
              continue;
            }
          }
        }

        for (const framework of frameworks) {
          if (!options.force && hasBundle(options.outDir, framework, component)) {
            skipped += 1;
            continue;
          }

          const result = await runJobsCreate(component, {
            framework,
            cacheDir: options.cacheDir,
            ...(options.offline !== undefined && { offline: options.offline }),
            ...(options.baseUrl !== undefined && { baseUrl: options.baseUrl }),
            outDir: `${options.outDir}/${framework}`,
            ...(options.sharedCache ? { sharedInputDir } : {}),
          });

          if (!result.success) {
            failures.push({ component, framework, errors: result.errors });
            logErrors(result.errors);
            if (options.failFast) {
              break;
            }
            continue;
          }

          generated += 1;
        }

        if (options.failFast && failures.length > 0) {
          break;
        }
      }

      const summary = {
        status: failures.length === 0 ? "ready" : "partial",
        componentCount: components.length,
        frameworks,
        generated,
        skipped,
        failed: failures.length,
        failures: failures.map((entry) => ({
          component: entry.component,
          framework: entry.framework,
          errors: entry.errors.map((error) => ({ code: error.code, message: error.message })),
        })),
      };

      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

      if (failures.length > 0) {
        process.exit(1);
      }
    });
}
