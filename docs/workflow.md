# shadcnui-foundry Workflow

This project now uses a prompt-first handoff model.

## End-to-End Flow

```mermaid
flowchart LR
    A[shadcn/ui Registry] --> B[Ingest<br/>internal to handoff]
    B --> C[Analyze<br/>Raw Artifact -> ComponentIR]
    C --> D[Agent Handoff Bundle]

    D --> E1[artifact.json]
    D --> E2[ir.json]
    D --> E3[prompt.md]

    B --> F[Cache<br/>.foundry/cache]
    D --> G[Agent-driven Implementation<br/>outside CLI]
```

## Command-Level Workflow

```mermaid
flowchart TD
    S[Start] --> H[Create Handoff<br/>foundry &lt;component&gt;]
    H --> O[Output Bundle<br/>.foundry/agent-jobs/&lt;component&gt;/]
    O --> A[Use prompt.md + ir.json + artifact.json<br/>with an implementation agent]
```

## Practical Notes

- Default command is handoff: `foundry <component>`
- Explicit command is available: `foundry handoff <component>`
- The CLI does not perform downstream framework translation in this mode.

## Typical Run

```bash
pnpm --filter @shadcnui-foundry/cli run foundry -- accordion
pnpm --filter @shadcnui-foundry/cli run foundry -- handoff accordion --framework angular
```
