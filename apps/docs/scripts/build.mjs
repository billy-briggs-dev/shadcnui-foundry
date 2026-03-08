import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const distDir = path.join(appRoot, "dist");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>shadcnui-foundry docs</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        font-family: Inter, Segoe UI, system-ui, sans-serif;
        background: #0b1020;
        color: #e8ecff;
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        padding: 2.5rem 1.25rem 3rem;
      }
      h1 { margin: 0 0 0.75rem; font-size: 2rem; }
      h2 { margin-top: 2rem; font-size: 1.25rem; }
      p, li { line-height: 1.65; color: #d0d8ff; }
      .card {
        background: #111936;
        border: 1px solid #33447c;
        border-radius: 12px;
        padding: 1rem;
        margin-top: 1rem;
      }
      code {
        background: #1d2850;
        border-radius: 6px;
        padding: 0.15rem 0.4rem;
      }
      a { color: #9ab1ff; }
    </style>
  </head>
  <body>
    <main>
      <h1>shadcnui-foundry documentation</h1>
      <p>
        Multi-framework generator pipeline for React, Vue, Svelte, Angular, and Lit.
      </p>

      <div class="card">
        <strong>Pipeline</strong>
        <p>Ingest → Analyze → Transform → Emit → Validate</p>
      </div>

      <h2>Quick start</h2>
      <ul>
        <li><code>pnpm install</code></li>
        <li><code>pnpm build</code></li>
        <li><code>pnpm test</code></li>
        <li><code>pnpm check</code></li>
      </ul>

      <h2>CLI</h2>
      <ul>
        <li><code>pnpm --filter @shadcnui-foundry/cli exec foundry list</code></li>
        <li><code>pnpm --filter @shadcnui-foundry/cli exec foundry ingest button</code></li>
        <li><code>pnpm --filter @shadcnui-foundry/cli exec foundry generate button --target react,vue</code></li>
      </ul>

      <h2>Playgrounds</h2>
      <ul>
        <li>React previews: <code>pnpm --filter @shadcnui-foundry/playground-react dev</code></li>
        <li>Vue previews: <code>pnpm --filter @shadcnui-foundry/playground-vue dev</code></li>
        <li>Svelte previews: <code>pnpm --filter @shadcnui-foundry/playground-svelte dev</code></li>
        <li>Angular previews: <code>pnpm --filter @shadcnui-foundry/playground-angular dev</code></li>
        <li>Lit previews: <code>pnpm --filter @shadcnui-foundry/playground-lit dev</code></li>
      </ul>

      <h2>Contributing</h2>
      <p>
        See the root <a href="../../CONTRIBUTING.md">CONTRIBUTING.md</a> for commit conventions,
        test requirements, and pull request workflow.
      </p>
    </main>
  </body>
</html>
`;

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "index.html"), html, "utf8");

console.log(`Built docs site to ${path.relative(appRoot, distDir)}`);
