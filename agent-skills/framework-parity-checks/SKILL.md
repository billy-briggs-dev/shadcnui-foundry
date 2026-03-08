---
name: framework-parity-checks
description: Evaluate cross-framework parity for generated components and accessibility metadata. Use when emitter behavior changes or parity regressions are suspected.
metadata:
  owner: shadcnui-foundry
  version: "1.0"
---

# Framework Parity Checks

## When to use this skill
Use after emitter updates or when validating consistency across React, Vue, Svelte, Angular, and Lit outputs.

## Priority components
Start with:
- `Button`
- `Input`
- `Card`

Then validate interactive overlays:
- `Dialog`
- `Popover`
- `DropdownMenu`
- `Select`

## Checklist
1. Compare generated API shape and default props.
2. Compare structure and semantics of emitted markup.
3. Compare a11y metadata parity:
   - roles
   - required/optional aria attrs
   - keyboard interactions
   - focus management
   - WCAG references
4. Run/update cross-framework snapshots when changes are intended.

## Exit criteria
- Intended parity differences are documented.
- Unexpected parity drift is fixed.
