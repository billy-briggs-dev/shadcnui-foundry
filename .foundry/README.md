# .foundry/

This directory contains runtime configuration and cached artifacts for the shadcnui-foundry pipeline.

## Contents

| Path | Description |
|------|-------------|
| `mcp.json` | MCP integration configuration |
| `cache/` | Cached registry artifacts (gitignored) |

## Cache

Registry artifacts fetched from shadcn/ui are cached in `.foundry/cache/` as JSON files.
Each cache entry includes:
- The raw artifact data
- `cachedAt` timestamp
- Source URL
- SHA-256 hash for integrity verification

The cache enables:
- **Offline regeneration**: run `foundry generate <component> --offline` without network access
- **Reproducible builds**: artifact content is locked to a specific version
- **Provenance tracking**: every generated file traces back to a cached source

## MCP Integration

When GitHub Copilot or another MCP-capable agent is active, the `shadcn-registry` MCP server
provides live component data. If MCP is unavailable, the pipeline falls back to cached artifacts.

Agents should NEVER make direct HTTP calls to the registry from within library packages.
Use `ShadcnRegistryIngester` from `@shadcnui-foundry/registry-ingest` instead.
