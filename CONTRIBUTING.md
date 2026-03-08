# Contributing to shadcnui-foundry

Thank you for contributing! Please read this guide before submitting changes.

## Development Setup

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9
pnpm install
pnpm build
pnpm test
```

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, wip, gen
Scope: kebab-case package name (e.g. ir, react, cli, registry-ingest)

Examples:
  feat(ir): add union prop type support
  fix(registry-ingest): handle 404 from registry gracefully
  gen(react): regenerate button component from updated IR
  test(analyzer): add category classifier edge cases
```

## Adding a New Framework Package

1. Copy the structure from `packages/react/`
2. Implement `Transformer` and `Emitter` interfaces from `@shadcnui-foundry/core`
3. Add the package to `pnpm-workspace.yaml` (already covered by `packages/*`)
4. Add a `vitest.config.ts` importing from `@shadcnui-foundry/vitest-config`
5. Add tests using `@shadcnui-foundry/test-utils` fixtures
6. Register the framework in `packages/cli` commands

## Package Dependency Rules

```
ir ← core ← registry-ingest ← cli
              ↑
           analyzer ← cli
              ↑
    react/vue/svelte/angular/lit ← cli
```

- `ir`: no internal deps
- `core`: depends on `ir` only
- framework packages: depend on `core` + `ir` only
- `cli`: depends on all pipeline packages

## Running Tests

```bash
pnpm test                        # All packages
pnpm --filter @shadcnui-foundry/ir test     # Single package
pnpm --filter @shadcnui-foundry/ir test -- --watch  # Watch mode
```

Visual regression suite:

```bash
pnpm test:visual
pnpm test:visual:update  # Regenerate baselines when intended
```

Build docs/playgrounds:

```bash
pnpm --filter @shadcnui-foundry/docs build
pnpm --filter @shadcnui-foundry/playground-react build
pnpm --filter @shadcnui-foundry/playground-vue build
```

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets).

```bash
pnpm changeset          # Create a changeset
pnpm version-packages   # Bump versions (CI does this automatically)
```

## Pull Request Process

1. Create a branch: `feat/<scope>/<description>` or `fix/<scope>/<description>`
2. Make changes with tests
3. Run `pnpm build && pnpm test && pnpm check`
4. Add a changeset if publishing: `pnpm changeset`
5. Open a PR against `main`
6. Ensure all CI checks pass
