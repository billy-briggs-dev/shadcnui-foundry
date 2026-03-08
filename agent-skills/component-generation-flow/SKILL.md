---
name: component-generation-flow
description: Execute the canonical prompt-first job-bundle workflow for shadcnui-foundry components. Use when preparing per-framework agent jobs from registry artifacts and IR.
compatibility: Requires built CLI and registry access (or offline cache).
metadata:
  owner: shadcnui-foundry
  version: "1.1"
---

# Component Generation Flow

## When to use this skill
Use this skill when the user asks to create component job bundles for one or all frameworks.

## Steps
1. Build the CLI package:
   - `pnpm --filter @shadcnui-foundry/cli build`
2. Create job bundles for all frameworks (default behavior):
   - `pnpm --filter @shadcnui-foundry/cli run foundry <component>`
3. Optional explicit single-framework job creation:
   - `pnpm --filter @shadcnui-foundry/cli run foundry jobs-create <component> --framework <react|vue|svelte|angular|lit>`
4. Inspect generated jobs:
   - `pnpm --filter @shadcnui-foundry/cli run foundry -- jobs <component>`
5. Confirm bundle outputs exist for each target framework:
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/artifact.json`
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/ir.json`
   - `packages/cli/.foundry/agent-jobs/<framework>/<component>/prompt.md`

## Outputs
- Shared cache bundle:
  - `packages/cli/.foundry/agent-jobs/_shared/<component>/artifact.json`
  - `packages/cli/.foundry/agent-jobs/_shared/<component>/ir.json`
- Framework bundles:
  - `packages/cli/.foundry/agent-jobs/react/<component>/...`
  - `packages/cli/.foundry/agent-jobs/vue/<component>/...`
  - `packages/cli/.foundry/agent-jobs/svelte/<component>/...`
  - `packages/cli/.foundry/agent-jobs/angular/<component>/...`
  - `packages/cli/.foundry/agent-jobs/lit/<component>/...`

## Safety checks
- Never silently overwrite generated source files.
- Do not make direct registry HTTP calls from library packages.
- Treat `ir.json` as canonical when implementation details conflict with prompt wording.

## Validation
- For CLI changes, run:
   - `pnpm --filter @shadcnui-foundry/cli test -- jobs-create.test.ts`
- For downstream framework implementation changes, run targeted package tests and parity checks.
