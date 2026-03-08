---
name: safe-generated-file-updates
description: Update generated artifacts safely without drifting from pipeline source of truth. Use when generated files or snapshots are modified.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Safe Generated File Updates

## When to use this skill
Use for any task touching generated outputs or snapshots.

## Rules
1. Do not hand-edit generated output as source of truth.
2. Regenerate via pipeline/CLI when behavior changes are intended.
3. Confirm generated headers and `irHash` presence.
4. Update snapshots only when output changes are intentional.
5. Use `gen(<scope>): ...` commit message for generated updates.

## Verification
- Re-run relevant package tests and cross-framework snapshots.
- Confirm no unrelated generated files changed unexpectedly.
