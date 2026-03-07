import { Command } from "commander";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { createLogger } from "@shadcnui-foundry/core";

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
    .option("--base-url <url>", "Registry base URL", "https://ui.shadcn.com/registry")
    .action(async (component: string, options: { offline?: boolean; cacheDir: string; baseUrl: string }) => {
      logger.info("Starting ingestion", { component });

      const ingester = new ShadcnRegistryIngester({
        offlineMode: options.offline,
        cacheDir: options.cacheDir,
        baseUrl: options.baseUrl,
      });

      const result = await ingester.ingest(component);

      if (!result.success) {
        for (const error of result.errors) {
          logger.error(error.message, { code: error.code });
        }
        process.exit(1);
      }

      process.stdout.write(
        JSON.stringify(result.data, null, 2) + "\n"
      );

      logger.info("Ingestion complete", { component });
    });
}
