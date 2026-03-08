import { createLogger } from "@shadcnui-foundry/core";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

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
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .option("--json", "Output as JSON array")
    .action(
      async (options: {
        offline?: boolean;
        cacheDir: string;
        baseUrl?: string;
        json?: boolean;
      }) => {
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
            if (options.json) {
              process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
            } else {
              for (const name of result.data) {
                process.stdout.write(`${name}\n`);
              }
            }
            return;
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

        process.exit(1);
      },
    );
}
