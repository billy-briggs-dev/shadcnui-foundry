# Roadmap

This file tracks implementation progress and future milestones for shadcnui-foundry.

## Phase 0 — Bootstrap ✅

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

## Phase 1 — IR + Ingest Pipeline

- [x] Full prop extraction from TS source files in registry artifacts
- [x] cva (class-variance-authority) variant parsing
- [x] Complete shadcn/ui component catalog analysis
- [x] MCP integration for live registry data
- [x] IR snapshot tests for all components
- [x] Storybook integration (apps/playground-*)

## Phase 2 — Framework Packages (Button, Input, Card)

- [x] ReactEmitter: full TSX with forwarded refs, variants, a11y attributes
- [x] VueEmitter: SFC with defineProps, defineEmits, useAttrs
- [x] SvelteEmitter: Svelte 5 runes syntax
- [x] AngularEmitter: standalone components with @Input
- [x] LitEmitter: LitElement with reactive properties
- [x] Cross-framework snapshot tests for Button, Input, Card

## Phase 3 — Interactive Components

- [x] Dialog, Popover, DropdownMenu, Select (overlay category)
- [x] Focus trap integration
- [x] Portal rendering strategy per framework
- [x] Keyboard navigation tests
- [x] Visual regression tests (Playwright)

## Phase 4 — Docs, Publishing, Polish

- [x] Docs site (apps/docs)
- [x] npm publishing via changesets
- [x] Component previews in playground apps
- [x] Contribution guide
- [x] Full WCAG 2.1 AA validation

## Phase 5 — Generator Depth & Parity

- [ ] Expand emitters to support broader shadcn catalog parity
- [ ] Cover complex composite components and edge-case props
- [ ] Enforce deterministic output guarantees (ordering/format invariants)
- [ ] Add framework parity scorecard per component
- [ ] Add parity snapshot coverage for priority component set

## Phase 6 — Quality Gates & Reliability

- [ ] Add stricter CI required gates (build, test, typecheck, lint, visual)
- [ ] Introduce flaky-test detection + retry strategy for visual tests
- [ ] Add golden IR regression fixtures for ingest/analyze drift
- [ ] Add repeated-run CI validation for reproducibility
- [ ] Document and enforce failure triage policy

## Phase 7 — Developer Experience & Docs Maturity

- [ ] Expand docs with IR spec and interface contract reference
- [ ] Publish contributor playbooks (new component, new framework package)
- [ ] Improve playground UX with props controls/knobs
- [ ] Add side-by-side framework preview comparisons
- [ ] Add troubleshooting guide for common pipeline failures

## Phase 8 — Release & Distribution Hardening

- [ ] Formalize release channels (canary/stable) with changesets
- [ ] Automate release notes generation
- [ ] Add package health checks for publish readiness
- [ ] Define compatibility/version support policy
- [ ] Define deprecation policy and migration guidance

## Phase 9 — Ecosystem & Extensibility

- [ ] Introduce plugin system for custom transforms/emitters
- [ ] Add configurable organization-specific rule packs
- [ ] Support optional hosted registry/cache synchronization
- [ ] Add opt-in telemetry and usage diagnostics
- [ ] Provide third-party extension examples + API docs

## Phase 10 — Security, Compatibility & Operations

- [ ] Security hardening: dependency auditing, SBOM generation, secret scanning, provenance/signing for releases
- [ ] Compatibility matrix: tested framework/runtime versions (React, Vue, Svelte, Angular, Lit, Node, pnpm)
- [ ] IR evolution policy: schema versioning strategy and migration tooling for `ComponentIR`
- [ ] Performance budgets: ingest/analyze/generate baselines with CI regression thresholds
- [ ] Generated output quality gates: bundle-size checks plus framework lint/type checks on generated artifacts
- [ ] CLI contract tests: stable flags, output shape, and error codes across releases
- [ ] Rollback and recovery playbook: release rollback procedure and cache recovery strategy
- [ ] Governance model: maintainer ownership, review rules, and decision log for breaking changes
- [ ] Telemetry/privacy policy: explicit opt-in behavior and data handling guarantees
- [ ] Long-term documentation plan: upgrade and migration guides across major versions
