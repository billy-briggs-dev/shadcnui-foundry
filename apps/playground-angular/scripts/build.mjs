import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const distDir = path.join(appRoot, "dist");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadSnippet(component, fileName) {
  const filePath = path.join(repoRoot, "generated", "angular", component, fileName);
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return `// Missing generated file: ${path.relative(repoRoot, filePath)}`;
  }
}

const components = [
  {
    label: "Button",
    preview: '<button class="btn">Button</button>',
    code: await loadSnippet("button", "button.component.ts"),
  },
  {
    label: "Input",
    preview: '<input class="input" placeholder="Type here" />',
    code: await loadSnippet("input", "input.component.ts"),
  },
  {
    label: "Card",
    preview:
      '<article class="card"><h3>Card title</h3><p>Generated component preview shell.</p></article>',
    code: await loadSnippet("card", "card.component.ts"),
  },
];

const cards = components
  .map(
    (component) => `
      <section class="panel">
        <h2>${component.label}</h2>
        <div class="preview">${component.preview}</div>
        <pre><code>${escapeHtml(component.code)}</code></pre>
      </section>
    `,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Angular playground</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: Inter, Segoe UI, system-ui, sans-serif; background: #1a1b2f; color: #f5f6ff; }
      main { max-width: 1040px; margin: 0 auto; padding: 2rem 1rem 3rem; }
      h1 { margin: 0 0 0.75rem; }
      p { color: #d6daff; line-height: 1.6; }
      .grid { display: grid; gap: 1rem; }
      .panel { background: #25284b; border: 1px solid #5f68b3; border-radius: 12px; padding: 1rem; }
      .preview { border: 1px dashed #7984df; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; }
      .btn { border: 0; padding: 0.5rem 0.9rem; border-radius: 8px; background: #dd0031; color: #fff; }
      .input { width: 100%; max-width: 260px; border: 1px solid #7984df; border-radius: 8px; padding: 0.45rem 0.6rem; background: #1a1b2f; color: #fff; }
      .card { border: 1px solid #7984df; border-radius: 10px; padding: 0.75rem; background: #1a1b2f; }
      pre { margin: 0; max-height: 240px; overflow: auto; border-radius: 8px; background: #1a1b2f; padding: 0.8rem; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>Angular component playground</h1>
      <p>Preview shells for generated components plus live generated source snippets.</p>
      <div class="grid">${cards}</div>
    </main>
  </body>
</html>
`;

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "index.html"), html, "utf8");

console.log(`Built Angular playground to ${path.relative(appRoot, distDir)}`);
