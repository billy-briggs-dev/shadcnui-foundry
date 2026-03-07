import { Command } from "commander";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { createLogger } from "@shadcnui-foundry/core";

const logger = createLogger("CLI:list");

/**
 * foundry list
 *
 * Lists all available components from the shadcn/ui registry.
 */
export function listCommand(): Command {
  return new Command("list")
    .description("List available components from the shadcn/ui registry")
    .option("--offline", "Use cached index only")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--json", "Output as JSON array")
    .action(async (options: { offline?: boolean; cacheDir: string; json?: boolean }) => {
      const ingester = new ShadcnRegistryIngester({
        offlineMode: options.offline,
        cacheDir: options.cacheDir,
      });

      const result = await ingester.list();

      if (!result.success) {
        for (const error of result.errors) {
          logger.error(error.message);
        }
        process.exit(1);
      }

      if (options.json) {
        process.stdout.write(JSON.stringify(result.data, null, 2) + "\n");
      } else {
        for (const name of result.data) {
          process.stdout.write(name + "\n");
        }
      }
    });
}
