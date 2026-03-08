---
name: fast-local-validation
description: Run the repository's standard validation flow quickly and safely. Use when changes are made and you need confidence before commit or push.
compatibility: Requires pnpm and local workspace dependencies installed.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Fast Local Validation

## When to use this skill
Use this skill after code changes to verify repository health with minimal back-and-forth.

## Steps
1. Run `pnpm build` from repo root.
2. Run `pnpm test` from repo root.
3. Run `pnpm check` from repo root.
4. If work is scoped, also run:
   - `pnpm --filter <package> test`
   - `pnpm --filter <package> typecheck`

## Expected outcome
- Build/test/lint pass.
- Any failures are fixed or explicitly documented before commit.

## Edge cases
- If snapshots changed unintentionally, stop and confirm before updating.
- If visual tests fail due to baseline drift, use the approved update flow (`pnpm test:visual:update`).
