## Summary

<!-- Describe the change and why it's needed -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Generated code update (`gen:` commit)
- [ ] Documentation update
- [ ] CI/tooling change

## Pipeline Stage Affected

- [ ] Ingest (`registry-ingest`)
- [ ] Analyze (`analyzer`)
- [ ] IR schema (`ir`)
- [ ] Transform / Emit (framework package)
- [ ] Validate (`a11y-rules`)
- [ ] CLI
- [ ] Tooling / Config
- [ ] Apps / Docs

## Checklist

- [ ] Tests added or updated for this change
- [ ] TypeScript types are strict (no new `any` or `!` assertions)
- [ ] Generated files include `@generated` header and provenance
- [ ] `pnpm build && pnpm test && pnpm check` passes locally
- [ ] Changeset added if this is a publishable change (`pnpm changeset`)
- [ ] Documentation updated if public API changed
