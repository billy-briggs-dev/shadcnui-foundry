---
name: component-generation-flow
description: Execute the canonical ingest-analyze-validate-generate workflow for shadcnui-foundry components. Use when adding or regenerating component outputs.
compatibility: Requires built CLI and registry access or offline cache.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Component Generation Flow

## When to use this skill
Use this skill when the user asks to ingest, analyze, validate, or generate component outputs.

## Steps
1. Ingest component:
   - `foundry ingest <component>`
2. Analyze artifact to IR using `ShadcnAnalyzer`.
3. Validate IR with `A11yValidator`.
4. Generate outputs:
   - `foundry generate <component> --target react,vue,svelte,angular,lit`
5. Verify generated files include required header and `irHash`.

## Safety checks
- Never silently overwrite files; use existing confirmation flow.
- Do not make direct registry HTTP calls from library packages.

## Validation
- Run targeted tests for changed framework packages.
- Run cross-framework snapshot tests when output semantics change.
