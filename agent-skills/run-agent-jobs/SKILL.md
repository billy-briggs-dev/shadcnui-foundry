---
name: run-agent-jobs
description: Execute framework-specific implementation jobs from handoff bundles (`prompt.md`, `ir.json`, `artifact.json`) and validate outputs package-by-package.
compatibility: Requires existing handoff bundles under `packages/cli/.foundry/agent-jobs/<framework>/<component>/`.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Run Agent Jobs

## When to use this skill
Use this skill after handoff bundles are generated and you want to implement component outputs with an agent in a controlled, repeatable loop.

## Prerequisite

## Discover runnable jobs

```bash
pnpm --filter @shadcnui-foundry/cli run foundry -- jobs <component>
```

## Chat trigger templates
Use one of these templates to hand off work to the coding agent.

Single framework job:

```text
Run agent job:
- framework: <react|vue|svelte|angular|lit>
- component: <component>
- prompt: packages/cli/.foundry/agent-jobs/<framework>/<component>/prompt.md
- ir: packages/cli/.foundry/agent-jobs/<framework>/<component>/ir.json
- artifact: packages/cli/.foundry/agent-jobs/<framework>/<component>/artifact.json
- output target: <target directory>
- constraints: <optional constraints>
```

All frameworks for one component:

```text
Run all agent jobs for component <component> from packages/cli/.foundry/agent-jobs and implement framework by framework with build/test validation after each framework.
```

Minimal one-liner:

```text
Run the <framework> <component> agent job from packages/cli/.foundry/agent-jobs/<framework>/<component> and validate with package build/test.
```

## Execution loop
For each framework job (`react`, `vue`, `svelte`, `angular`, `lit`):

1. Read bundle inputs from:
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/prompt.md`
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/ir.json`
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/artifact.json`
2. Run an implementation agent using `prompt.md` as the primary instruction and `ir.json` as source truth.
3. Write generated component files to the expected framework output location.
4. Validate that framework package:
   - `pnpm --filter @shadcnui-foundry/<framework> build`
   - `pnpm --filter @shadcnui-foundry/<framework> test`
5. Move to next framework only after build/test pass.

## Recommended execution modes
- Single job mode: use when iterating on one framework implementation.
- Batch mode: run one component across all frameworks in sequence.
- Resume mode: continue only failed frameworks from a previous batch.

## Safety checks
- Do not edit handoff bundle files manually.
- Treat `ir.json` as canonical when prompt and implementation differ.
- Keep changes framework-scoped; avoid unrelated file edits.
- If one framework fails validation, stop and fix before continuing.

## Completion criteria
- All target frameworks complete implementation for the component.
- All package-level build/test checks pass.
- Optional parity check passes:

```bash
pnpm parity:scorecard
```
