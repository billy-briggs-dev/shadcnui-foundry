# shadcnui-foundry

> A multi-framework component generation pipeline inspired by shadcn/ui.

shadcnui-foundry ingests component definitions from the [shadcn/ui](https://ui.shadcn.com) registry,
normalizes them into a framework-neutral intermediate representation (IR), then generates idiomatic
implementations for **React**, **Vue**, **Svelte**, **Angular**, and **Lit/Web Components**.

## Architecture

```
[shadcn/ui Registry] → Ingest → Analyze → Transform → Emit → [Generated Components]
                                                 ↓
                                            Validate (a11y-rules)
```

| Stage     | Package                              | Description                                  |
|-----------|--------------------------------------|----------------------------------------------|
| Ingest    | `@shadcnui-foundry/registry-ingest`  | Fetch + cache registry artifacts             |
| Analyze   | `@shadcnui-foundry/analyzer`         | Normalize artifacts → ComponentIR            |
| Transform | `@shadcnui-foundry/{react,vue,...}`  | Adapt IR for target framework                |
| Emit      | `@shadcnui-foundry/{react,vue,...}`  | Generate source file content                 |
| Validate  | `@shadcnui-foundry/a11y-rules`       | Accessibility rule checking                  |
| CLI       | `@shadcnui-foundry/cli`              | `foundry ingest`, `generate`, `list`         |

## Monorepo Structure

```
/apps
  /docs                    # Documentation site
  /playground-react        # React component playground
  /playground-vue          # Vue component playground
  /playground-svelte       # Svelte component playground
  /playground-angular      # Angular component playground
  /playground-lit          # Lit component playground
/packages
  /ir                      # Zod schemas for ComponentIR
  /core                    # Pipeline interfaces + Pipeline orchestrator
  /registry-ingest         # shadcn/ui registry ingestion + caching
  /analyzer                # ComponentIR normalization
  /react                   # React transformer + emitter
  /vue                     # Vue transformer + emitter
  /svelte                  # Svelte transformer + emitter
  /angular                 # Angular transformer + emitter
  /lit                     # Lit/Web Components transformer + emitter
  /tokens                  # Design token extraction
  /a11y-rules              # Accessibility validation
  /test-utils              # Test fixtures + assertion helpers
  /cli                     # CLI (foundry ingest / generate / list)
/tooling
  /typescript-config       # Shared tsconfigs (base, node, library, react)
  /biome-config            # Shared Biome configuration
  /vitest-config           # Shared Vitest configuration
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint + format
pnpm check
```

### CLI Usage

```bash
# List available components
pnpm --filter @shadcnui-foundry/cli exec foundry list

# Ingest a component from the shadcn/ui registry
pnpm --filter @shadcnui-foundry/cli exec foundry ingest button

# Generate components for target frameworks
pnpm --filter @shadcnui-foundry/cli exec foundry generate button --target react,vue
```

## Tooling Choices

| Tool | Choice | Reason |
|------|--------|--------|
| Monorepo | pnpm workspaces + Turborepo | Best-in-class task caching and pipeline control |
| Formatter/Linter | Biome | Single tool, zero config, fast, TypeScript-native |
| Build | tsup | Zero-config, esbuild-powered, ESM+CJS+dts output |
| Testing | Vitest | ESM-native, fast, Vite-compatible |
| Schemas | Zod | Runtime validation + TypeScript inference |
| Versioning | Changesets | Correct semver for monorepos |

> **Biome vs ESLint+Prettier:** Biome is chosen because it replaces both tools with a single fast binary,
> has no plugin ecosystem debt, and produces identical formatting across all contributors.
> Trade-off: fewer specialized lint rules (no `eslint-plugin-react-hooks` etc.), but for a code generation
> pipeline this is acceptable — framework-specific lint rules belong in consumer projects, not the generator.

> **tsup vs unbuild:** tsup is chosen because it produces clean ESM output with `.d.ts` declarations
> in a single command, requires no configuration for simple packages, and is powered by esbuild.
> unbuild (unjs) is excellent for dual CJS/ESM with better tree-shaking, but the added complexity
> isn't needed here since all packages are ESM-only.

## Implementation Roadmap

The full phased roadmap lives in [ROADMAP.md](./ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

MIT
