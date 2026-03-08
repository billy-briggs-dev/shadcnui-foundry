import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { createLogger } from "@shadcnui-foundry/core";
import type { RawRegistryArtifact } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineError, PipelineResult } from "@shadcnui-foundry/ir";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

const logger = createLogger("CLI:jobs-create");

type JobsCreateOptions = {
  offline?: boolean;
  cacheDir: string;
  baseUrl?: string;
  outDir: string;
  framework: string;
  sharedInputDir?: string;
};

export type JobsCreateRunOptions = JobsCreateOptions;

export type JobsCreateBundle = {
  status: "ready";
  component: string;
  framework: string;
  cache: {
    artifactWritten: boolean;
    irWritten: boolean;
    promptWritten: boolean;
  };
  output: {
    runDir: string;
    artifact: string;
    ir: string;
    prompt: string;
  };
};

type AnalyzerLike = {
  analyze(artifact: RawRegistryArtifact): Promise<PipelineResult<ComponentIR>>;
};

async function createAnalyzer(): Promise<AnalyzerLike> {
  const analyzerModuleName = `@shadcnui-foundry/${"analyzer"}`;
  const module = (await import(analyzerModuleName)) as {
    ShadcnAnalyzer?: new () => AnalyzerLike;
  };

  if (!module.ShadcnAnalyzer) {
    throw new Error("Analyzer package is missing ShadcnAnalyzer export");
  }

  return new module.ShadcnAnalyzer();
}

function writeFileIfChanged(filePath: string, content: string): boolean {
  if (existsSync(filePath)) {
    const current = readFileSync(filePath, "utf8");
    if (current === content) {
      return false;
    }
  }

  writeFileSync(filePath, content, "utf8");
  return true;
}

function stripIrVolatileFields(ir: ComponentIR): Record<string, unknown> {
  return {
    ...ir,
    generatedAt: "__normalized__",
    provenance: {
      ...ir.provenance,
      fetchedAt: "__normalized__",
    },
  };
}

function writeIrIfChanged(filePath: string, ir: ComponentIR): boolean {
  if (existsSync(filePath)) {
    const currentRaw = readFileSync(filePath, "utf8");
    try {
      const currentParsed = JSON.parse(currentRaw) as ComponentIR;
      const currentNormalized = JSON.stringify(stripIrVolatileFields(currentParsed));
      const nextNormalized = JSON.stringify(stripIrVolatileFields(ir));
      if (currentNormalized === nextNormalized) {
        return false;
      }
    } catch {
      // Fall through to overwrite if existing JSON is malformed.
    }
  }

  writeFileSync(filePath, `${JSON.stringify(ir, null, 2)}\n`, "utf8");
  return true;
}

function isSameFile(sourcePath: string, destinationPath: string): boolean {
  try {
    const sourceStats = statSync(sourcePath);
    const destinationStats = statSync(destinationPath);
    return sourceStats.dev === destinationStats.dev && sourceStats.ino === destinationStats.ino;
  } catch {
    return false;
  }
}

function linkOrCopySharedFile(sourcePath: string, destinationPath: string): boolean {
  const sourceContent = readFileSync(sourcePath, "utf8");

  if (existsSync(destinationPath)) {
    if (isSameFile(sourcePath, destinationPath)) {
      return false;
    }

    const current = readFileSync(destinationPath, "utf8");
    if (current === sourceContent) {
      return false;
    }

    unlinkSync(destinationPath);
  }

  try {
    linkSync(sourcePath, destinationPath);
    return true;
  } catch {
    writeFileSync(destinationPath, sourceContent, "utf8");
    return true;
  }
}

async function ingestWithFallback(
  component: string,
  options: Pick<JobsCreateOptions, "cacheDir" | "offline" | "baseUrl">,
): Promise<PipelineResult<RawRegistryArtifact>> {
  const baseUrls = resolveRegistryBaseUrls(options.baseUrl);

  for (let index = 0; index < baseUrls.length; index += 1) {
    const baseUrl = baseUrls[index];
    if (!baseUrl) {
      continue;
    }

    const ingester = new ShadcnRegistryIngester({
      ...(options.offline !== undefined && { offlineMode: options.offline }),
      cacheDir: options.cacheDir,
      baseUrl,
    });

    const ingestResult = await ingester.ingest(component);
    if (ingestResult.success) {
      logger.info("Ingestion complete", { component, baseUrl });
      return ingestResult;
    }

    for (const error of ingestResult.errors) {
      logger.error(error.message, { code: error.code, baseUrl });
    }

    const hasNext = index < baseUrls.length - 1;
    if (hasNext) {
      logger.warn("Ingestion failed on endpoint, trying fallback", {
        component,
        failedBaseUrl: baseUrl,
        nextBaseUrl: baseUrls[index + 1] ?? null,
      });
    }
  }

  return {
    success: false,
    errors: [
      {
        code: "INGEST_FAILED",
        message: `Failed to ingest component: ${component}`,
      },
    ],
  };
}

function toPrompt(
  component: string,
  framework: string,
  irPath: string,
  artifactPath: string,
): string {
  return `# Agent Job: ${component}

You are implementing one framework-specific component as a reusable shared-library export.

This job expects concrete, importable component code under the framework package, not string-based generators.

## Inputs

- Component: \`${component}\`
- Target framework package: \`packages/${framework}\`
- IR file: \`${irPath}\`
- Raw artifact file: \`${artifactPath}\`

## Primary Goal

1. Use the provided IR and raw artifact as the single source of truth for this component.
2. Implement framework-native component code that is directly importable from \`packages/${framework}\`.
3. Ensure Storybook stories use imports from framework source exports, not inline shell markup.
4. Add or update tests for the framework component behavior and public API.

## Required Output Shape

- Create/update a framework component module for this component under \`packages/${framework}/src/\`.
- Export the component (and related public types/helpers if needed) from \`packages/${framework}/src/index.ts\`.
- Keep all implementation framework-idiomatic (React/Vue/Svelte/Angular/Lit conventions).
- Include Tailwind utility classes/attributes using shadcn/ui defaults (tokens, spacing, typography, and state classes) instead of leaving markup unstyled.

## Explicit Non-Goals

- Do NOT create generator wrappers such as \`generate${component}Files\` APIs.
- Do NOT emit component source as string templates inside TypeScript functions.
- Do NOT create source-dump story shells (for example \`GeneratedShells\`/\`GeneratedStories\`).
- Do NOT add unrelated framework changes outside this component scope.

## Story Requirements

- Use a component-focused story file named after the component (for example \`${component}.stories.*\`).
- Story filename/extension by framework is required:
  - react: \`packages/react/stories/${component}.stories.tsx\`
  - vue: \`packages/vue/stories/${component}.stories.ts\`
  - svelte: \`packages/svelte/stories/${component}.stories.ts\`
  - angular: \`packages/angular/stories/${component}.stories.ts\`
  - lit: \`packages/lit/stories/${component}.stories.ts\`
- Stories must import component exports from \`../src/${component}.js\` or package entry exports.
- Story examples should demonstrate Tailwind-styled output that reflects shadcn/ui default visual behavior.
- Include at least three meaningful stories:
  - Default state
  - Variant/state example (size, type, disabled, open, etc.)
  - Accessibility-focused example (labeling/keyboard/focus behavior)
- Use framework-idiomatic CSF conventions and typed args where applicable.
- Keep stories deterministic and reusable; avoid inline random data.

## Acceptance Criteria

- The output for \`${component}\` is a real, importable framework component library API.
- Framework package entrypoint exports the component for shared usage.
- Tests pass for the changed package.
- Storybook stories for \`${component}\` are structured, component-focused, and ready to render in package-local Storybook.
`;
}

/**
 * foundry jobs-create <component>
 *
 * Creates per-component files (artifact, IR, prompt) for agent-driven implementation.
 */
export function jobsCreateCommand(): Command {
  return new Command("jobs-create")
    .description("Create an agent job bundle for a single component")
    .argument("<component>", "Component name (e.g. accordion, dialog)")
    .option("-f, --framework <name>", "Target framework package", "react")
    .option("--offline", "Use cached artifacts only")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .option("--out-dir <dir>", "Output directory", ".foundry/agent-jobs")
    .option("--shared-input-dir <dir>", "Read artifact/IR from shared cache at <dir>/<component>")
    .action(async (component: string, options: JobsCreateRunOptions) => {
      const result = await runJobsCreate(component, options);

      if (!result.success) {
        logErrors(result.errors);
        process.exit(1);
      }

      process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
    });
}

function logErrors(errors: PipelineError[]): void {
  for (const error of errors) {
    logger.error(error.message, { code: error.code, path: error.path, context: error.context });
  }
}

export async function runJobsCreate(
  component: string,
  options: JobsCreateRunOptions,
): Promise<PipelineResult<JobsCreateBundle>> {
  const runDir = resolve(process.cwd(), options.outDir, component);
  const artifactPath = resolve(runDir, "artifact.json");
  const irPath = resolve(runDir, "ir.json");
  const promptPath = resolve(runDir, "prompt.md");

  mkdirSync(dirname(artifactPath), { recursive: true });

  let artifactWritten = false;
  let irWritten = false;

  if (options.sharedInputDir) {
    const sharedRunDir = resolve(process.cwd(), options.sharedInputDir, component);
    const sharedArtifactPath = resolve(sharedRunDir, "artifact.json");
    const sharedIrPath = resolve(sharedRunDir, "ir.json");

    if (!existsSync(sharedArtifactPath) || !existsSync(sharedIrPath)) {
      return {
        success: false,
        errors: [
          {
            code: "SHARED_INPUT_MISSING",
            message: `Shared input files are missing for component: ${component}`,
            path: sharedRunDir,
          },
        ],
      };
    }

    artifactWritten = linkOrCopySharedFile(sharedArtifactPath, artifactPath);
    irWritten = linkOrCopySharedFile(sharedIrPath, irPath);
  } else {
    const ingestResult = await ingestWithFallback(component, options);
    if (!ingestResult.success) {
      return ingestResult;
    }

    const analyzer = await createAnalyzer();
    const analyzeResult = await analyzer.analyze(ingestResult.data);
    if (!analyzeResult.success) {
      return analyzeResult;
    }

    const artifactContent = `${JSON.stringify(ingestResult.data, null, 2)}\n`;
    const irData = analyzeResult.data;
    artifactWritten = writeFileIfChanged(artifactPath, artifactContent);
    irWritten = writeIrIfChanged(irPath, irData);
  }

  const prompt = toPrompt(component, options.framework, irPath, artifactPath);
  const promptWritten = writeFileIfChanged(promptPath, `${prompt}\n`);

  logger.info("Job bundle write status", {
    component,
    framework: options.framework,
    artifactWritten,
    irWritten,
    promptWritten,
  });

  return {
    success: true,
    data: {
      status: "ready",
      component,
      framework: options.framework,
      cache: {
        artifactWritten,
        irWritten,
        promptWritten,
      },
      output: {
        runDir,
        artifact: artifactPath,
        ir: irPath,
        prompt: promptPath,
      },
    },
  };
}
