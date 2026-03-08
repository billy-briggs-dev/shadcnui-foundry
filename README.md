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

### Phase 0 — Bootstrap ✅

- [x] pnpm workspace + Turborepo
- [x] TypeScript configs (base, node, library, react)
- [x] Biome formatter + linter
- [x] Changesets + commitlint + husky
- [x] IR schemas (ComponentIR, PropSchema, VariantSchema, A11ySchema, TokenSchema)
- [x] Core pipeline interfaces (Ingester, Analyzer, Transformer, Emitter, Validator)
- [x] Pipeline orchestrator
- [x] ShadcnRegistryIngester + ArtifactCache
- [x] ShadcnAnalyzer + category classifier
- [x] Stub framework packages (React, Vue, Svelte, Angular, Lit)
- [x] Design token extraction
- [x] Accessibility rules + validator
- [x] CLI (foundry ingest / generate / list)
- [x] VS Code workspace config
- [x] GitHub Actions CI
- [x] AGENTS.md + Copilot instructions

### Phase 1 — IR + Ingest Pipeline

- [x] Full prop extraction from TS source files in registry artifacts
- [x] cva (class-variance-authority) variant parsing
- [x] Complete shadcn/ui component catalog analysis
- [x] MCP integration for live registry data
- [x] IR snapshot tests for all components
- [ ] Storybook integration (apps/playground-react)

### Phase 2 — Framework Packages (Button, Input, Card)

- [x] ReactEmitter: full TSX with forwarded refs, variants, a11y attributes
- [x] VueEmitter: SFC with defineProps, defineEmits, useAttrs
- [x] SvelteEmitter: Svelte 5 runes syntax
- [x] AngularEmitter: standalone components with @Input
- [x] LitEmitter: LitElement with reactive properties
- [x] Cross-framework snapshot tests for Button, Input, Card

### Phase 3 — Interactive Components

- [x] Dialog, Popover, DropdownMenu, Select (overlay category)
- [x] Focus trap integration
- [x] Portal rendering strategy per framework
- [x] Keyboard navigation tests
- [x] Visual regression tests (Playwright)

### Phase 4 — Docs, Publishing, Polish

- [x] Docs site (apps/docs)
- [x] npm publishing via changesets
- [x] Component previews in playground apps
- [x] Contribution guide
- [x] Full WCAG 2.1 AA validation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

MIT
