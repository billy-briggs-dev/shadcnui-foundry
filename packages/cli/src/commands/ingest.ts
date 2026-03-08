import { createLogger } from "@shadcnui-foundry/core";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

const logger = createLogger("CLI:ingest");

/**
 * foundry ingest <component>
 *
 * Fetches a component from the shadcn/ui registry and caches it locally.
 */
export function ingestCommand(): Command {
  return new Command("ingest")
    .description("Ingest a component from the shadcn/ui registry")
    .argument("<component>", "Component name to ingest (e.g. button, dialog)")
    .option("--offline", "Use cached artifacts only, do not make network requests")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .action(
      async (
        component: string,
        options: { offline?: boolean; cacheDir: string; baseUrl?: string },
      ) => {
        const baseUrls = resolveRegistryBaseUrls(options.baseUrl);
        logger.info("Starting ingestion", { component, baseUrls });

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

          const result = await ingester.ingest(component);
          if (result.success) {
            process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
            logger.info("Ingestion complete", { component, baseUrl });
            return;
          }

          for (const error of result.errors) {
            logger.error(error.message, { code: error.code, baseUrl });
          }

          const hasNext = index < baseUrls.length - 1;
          if (hasNext) {
            logger.warn("Ingestion failed on endpoint, trying fallback", {
              component,
              failedBaseUrl: baseUrl,
              nextBaseUrl: baseUrls[index + 1] ?? null,
            });
          }
        }

        process.exit(1);
      },
    );
}
