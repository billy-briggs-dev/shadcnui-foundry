import { createLogger } from "@shadcnui-foundry/core";
import type { PipelineResult } from "@shadcnui-foundry/ir";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { runGenerate } from "./generate.js";
import type { GenerateRunOptions } from "./generate.js";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

const logger = createLogger("CLI:generate-all");

type GenerateAllOptions = GenerateRunOptions & {
  failFast?: boolean;
  allowPartial?: boolean;
};

async function listComponentsWithFallback(
  options: Pick<GenerateAllOptions, "cacheDir" | "offline" | "baseUrl">,
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

/**
 * foundry generate-all --target react,vue
 *
 * Generates all registry components through ingest → analyze → transform → emit.
 */
export function generateAllCommand(): Command {
  return new Command("generate-all")
    .description("Generate framework implementations for all available components")
    .option("-t, --target <frameworks>", "Comma-separated framework targets", "react")
    .option("--offline", "Use cached artifacts only")
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .option("--out-dir <dir>", "Output directory", "generated")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--force", "Overwrite existing generated files")
    .option("--fail-fast", "Stop on first component generation failure")
    .option("--allow-partial", "Exit successfully when some components fail")
    .action(async (options: GenerateAllOptions) => {
      const listResult = await listComponentsWithFallback(options);
      if (!listResult.success) {
        for (const error of listResult.errors) {
          logger.error(error.message, { code: error.code });
        }
        process.exit(1);
      }

      const components = listResult.data;
      const succeeded: string[] = [];
      const failed: Array<{ component: string; errors: Array<{ code: string; message: string }> }> =
        [];

      logger.info("Starting generate-all run", {
        componentCount: components.length,
        target: options.target,
      });

      for (const component of components) {
        logger.info("Generating component", { component });

        const generateResult = await runGenerate(component, options);
        if (generateResult.success) {
          succeeded.push(component);
          continue;
        }

        failed.push({
          component,
          errors: generateResult.errors.map((error) => ({
            code: error.code,
            message: error.message,
          })),
        });

        for (const error of generateResult.errors) {
          logger.error(error.message, { component, code: error.code });
        }

        if (options.failFast) {
          break;
        }
      }

      const summary = {
        status: failed.length === 0 ? "generated" : "partial",
        total: components.length,
        succeeded: succeeded.length,
        failed: failed.length,
        failedComponents: failed.map((entry) => entry.component),
      };

      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

      if (failed.length > 0 && !options.allowPartial) {
        process.exit(1);
      }
    });
}
