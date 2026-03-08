---
name: storybook-playground-parity
description: Keep Storybook setup and generated preview stories aligned across playground apps. Use when adding or updating framework playground experiences.
compatibility: Requires Storybook dependencies in each playground app.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Storybook Playground Parity

## When to use this skill
Use when adding Storybook support or maintaining parity across framework playground apps.

## Required structure
- Storybook config location per app: `/.storybook-cjs/`
- Story files location per app: `/stories/`

## Steps
1. Ensure app scripts exist:
   - `storybook`
   - `storybook:build`
2. Ensure framework-specific Storybook package dependencies are installed.
3. Add generated source preview stories for `Button`, `Input`, and `Card`.
4. Build Storybook for the app:
   - `pnpm --filter <playground-package> storybook:build`
5. Do not commit `storybook-static/` output.

## Validation matrix
- React playground Storybook build passes.
- Vue playground Storybook build passes.
- Svelte playground Storybook build passes.
- Angular playground Storybook build passes.
- Lit playground Storybook build passes.
