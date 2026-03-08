import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

const FALLBACK_BASE_URL = "https://ui.shadcn.com/r/styles/new-york";
const LEGACY_FALLBACK_BASE_URL = "https://ui.shadcn.com/r/styles/default";

type McpServerConfig = {
  type?: string;
  baseUrl?: string;
  enabled?: boolean;
};

type McpConfig = {
  servers?: Record<string, McpServerConfig>;
};

function findMcpConfigPath(startDir: string): string | null {
  let current = startDir;

  while (true) {
    const candidate = join(current, ".foundry", "mcp.json");
    if (existsSync(candidate)) {
      return candidate;
    }

    const root = parse(current).root;
    if (current === root) {
      return null;
    }
    current = dirname(current);
  }
}

function parseMcpConfig(raw: string): McpConfig | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed as McpConfig;
  } catch {
    return null;
  }
}

/**
 * Resolves the registry base URL with precedence:
 * 1) CLI --base-url option
 * 2) `.foundry/mcp.json` shadcn-registry server baseUrl (if enabled)
 * 3) built-in fallback endpoint
 */
export function resolveRegistryBaseUrl(cliBaseUrl: string | undefined): string {
  if (cliBaseUrl && cliBaseUrl.trim().length > 0) {
    return cliBaseUrl;
  }

  const configPath = findMcpConfigPath(process.cwd());
  if (!configPath) {
    return FALLBACK_BASE_URL;
  }

  const config = parseMcpConfig(readFileSync(configPath, "utf8"));
  const server = config?.servers?.["shadcn-registry"];

  if (server?.enabled === false) {
    return FALLBACK_BASE_URL;
  }

  if (typeof server?.baseUrl === "string" && server.baseUrl.trim().length > 0) {
    return server.baseUrl;
  }

  return FALLBACK_BASE_URL;
}

/**
 * Resolves base URL candidates, preferring MCP config while keeping HTTP fallback endpoints.
 */
export function resolveRegistryBaseUrls(cliBaseUrl: string | undefined): string[] {
  if (cliBaseUrl && cliBaseUrl.trim().length > 0) {
    return [cliBaseUrl];
  }

  const preferred = resolveRegistryBaseUrl(undefined);
  const unique = new Set<string>([preferred, FALLBACK_BASE_URL, LEGACY_FALLBACK_BASE_URL]);
  return [...unique];
}
