import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { createLogger } from "@shadcnui-foundry/core";
import type {
  Emitter,
  IRValidator,
  RawRegistryArtifact,
  Transformer,
} from "@shadcnui-foundry/core";
import { sha256 } from "@shadcnui-foundry/core";
import type {
  ComponentIR,
  FrameworkTarget,
  GeneratedFile,
  PipelineResult,
} from "@shadcnui-foundry/ir";
import { ShadcnRegistryIngester } from "@shadcnui-foundry/registry-ingest";
import { Command } from "commander";
import { resolveRegistryBaseUrls } from "./mcp-config.js";

const logger = createLogger("CLI:generate");

const KNOWN_TARGETS: FrameworkTarget[] = ["react", "vue", "svelte", "angular", "lit"];

function parseTargets(rawTargets: string): PipelineResult<FrameworkTarget[]> {
  const targets = rawTargets
    .split(",")
    .map((target) => target.trim())
    .filter((target): target is FrameworkTarget =>
      KNOWN_TARGETS.includes(target as FrameworkTarget),
    );

  if (targets.length === 0) {
    return {
      success: false,
      errors: [
        {
          code: "INVALID_TARGET",
          message: `No valid targets found. Supported targets: ${KNOWN_TARGETS.join(", ")}`,
        },
      ],
    };
  }

  return { success: true, data: [...new Set(targets)] };
}

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

async function createValidator(): Promise<IRValidator> {
  const validatorModuleName = `@shadcnui-foundry/${"a11y-rules"}`;
  const module = (await import(validatorModuleName)) as {
    A11yValidator?: new () => IRValidator;
  };

  if (!module.A11yValidator) {
    throw new Error("A11y package is missing A11yValidator export");
  }

  return new module.A11yValidator();
}

async function createTransformers(): Promise<Map<FrameworkTarget, Transformer>> {
  const reactModule = (await import(`@shadcnui-foundry/${"react"}`)) as {
    ReactTransformer?: new () => Transformer;
  };
  const vueModule = (await import(`@shadcnui-foundry/${"vue"}`)) as {
    VueTransformer?: new () => Transformer;
  };
  const svelteModule = (await import(`@shadcnui-foundry/${"svelte"}`)) as {
    SvelteTransformer?: new () => Transformer;
  };
  const angularModule = (await import(`@shadcnui-foundry/${"angular"}`)) as {
    AngularTransformer?: new () => Transformer;
  };
  const litModule = (await import(`@shadcnui-foundry/${"lit"}`)) as {
    LitTransformer?: new () => Transformer;
  };

  if (!reactModule.ReactTransformer) {
    throw new Error("React package is missing ReactTransformer export");
  }
  if (!vueModule.VueTransformer) {
    throw new Error("Vue package is missing VueTransformer export");
  }
  if (!svelteModule.SvelteTransformer) {
    throw new Error("Svelte package is missing SvelteTransformer export");
  }
  if (!angularModule.AngularTransformer) {
    throw new Error("Angular package is missing AngularTransformer export");
  }
  if (!litModule.LitTransformer) {
    throw new Error("Lit package is missing LitTransformer export");
  }

  return new Map<FrameworkTarget, Transformer>([
    ["react", new reactModule.ReactTransformer()],
    ["vue", new vueModule.VueTransformer()],
    ["svelte", new svelteModule.SvelteTransformer()],
    ["angular", new angularModule.AngularTransformer()],
    ["lit", new litModule.LitTransformer()],
  ]);
}

async function createEmitters(): Promise<Map<FrameworkTarget, Emitter>> {
  const reactModule = (await import(`@shadcnui-foundry/${"react"}`)) as {
    ReactEmitter?: new () => Emitter;
  };
  const vueModule = (await import(`@shadcnui-foundry/${"vue"}`)) as {
    VueEmitter?: new () => Emitter;
  };
  const svelteModule = (await import(`@shadcnui-foundry/${"svelte"}`)) as {
    SvelteEmitter?: new () => Emitter;
  };
  const angularModule = (await import(`@shadcnui-foundry/${"angular"}`)) as {
    AngularEmitter?: new () => Emitter;
  };
  const litModule = (await import(`@shadcnui-foundry/${"lit"}`)) as {
    LitEmitter?: new () => Emitter;
  };

  if (!reactModule.ReactEmitter) {
    throw new Error("React package is missing ReactEmitter export");
  }
  if (!vueModule.VueEmitter) {
    throw new Error("Vue package is missing VueEmitter export");
  }
  if (!svelteModule.SvelteEmitter) {
    throw new Error("Svelte package is missing SvelteEmitter export");
  }
  if (!angularModule.AngularEmitter) {
    throw new Error("Angular package is missing AngularEmitter export");
  }
  if (!litModule.LitEmitter) {
    throw new Error("Lit package is missing LitEmitter export");
  }

  return new Map<FrameworkTarget, Emitter>([
    ["react", new reactModule.ReactEmitter()],
    ["vue", new vueModule.VueEmitter()],
    ["svelte", new svelteModule.SvelteEmitter()],
    ["angular", new angularModule.AngularEmitter()],
    ["lit", new litModule.LitEmitter()],
  ]);
}

type PlannedWrite = {
  absolutePath: string;
  outputRelativePath: string;
  file: GeneratedFile;
};

export type GenerateRunOptions = {
  target: string;
  offline?: boolean;
  baseUrl?: string;
  outDir: string;
  cacheDir: string;
  force?: boolean;
};

export type GenerateRunSummary = {
  component: string;
  targets: FrameworkTarget[];
  outDir: string;
  status: "generated";
  irHash: string;
  manifest: string;
  files: string[];
  validation?: {
    passed: boolean;
    issues: number;
  };
};

type GenerationManifestEntry = {
  runId: string;
  generatedAt: string;
  component: string;
  targets: FrameworkTarget[];
  irHash: string;
  fileCount: number;
  files: string[];
  validation?: {
    passed: boolean;
    issues: number;
  };
};

type GenerationManifest = {
  version: 1;
  updatedAt: string;
  entries: GenerationManifestEntry[];
};

function readManifest(manifestPath: string): GenerationManifest {
  if (!existsSync(manifestPath)) {
    return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
  }

  try {
    const raw = readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<GenerationManifest>;
    if (parsed.version === 1 && Array.isArray(parsed.entries)) {
      return {
        version: 1,
        updatedAt:
          typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        entries: parsed.entries,
      };
    }
  } catch {
    // Ignore malformed manifest and recreate it.
  }

  return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
}

function writeManifest(outDir: string, entry: GenerationManifestEntry): string {
  const manifestPath = resolve(process.cwd(), outDir, ".foundry", "manifest.json");
  const manifest = readManifest(manifestPath);

  manifest.entries.push(entry);
  manifest.updatedAt = new Date().toISOString();

  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return manifestPath;
}

async function confirmOverwrite(paths: string[]): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `Overwrite ${paths.length} existing generated file(s)? [y/N] `,
    );
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

async function ingestWithFallback(
  component: string,
  options: { cacheDir: string; offline?: boolean; baseUrl?: string },
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

export async function runGenerate(
  component: string,
  options: GenerateRunOptions,
): Promise<PipelineResult<GenerateRunSummary>> {
  const parsedTargets = parseTargets(options.target);
  if (!parsedTargets.success) {
    return parsedTargets;
  }

  const targets = parsedTargets.data;
  logger.info("Starting generation", { component, targets });

  const ingestResult = await ingestWithFallback(component, {
    cacheDir: options.cacheDir,
    ...(options.offline !== undefined && { offline: options.offline }),
    ...(options.baseUrl !== undefined && { baseUrl: options.baseUrl }),
  });
  if (!ingestResult.success) {
    return ingestResult;
  }

  const analyzer = await createAnalyzer();
  const analyzeResult = await analyzer.analyze(ingestResult.data);
  if (!analyzeResult.success) {
    return analyzeResult;
  }

  const ir = analyzeResult.data;
  const validator = await createValidator();
  const validationResult = await validator.validate(ir);
  if (validationResult.success && !validationResult.data.passed) {
    logger.warn("A11y validation reported issues", {
      component,
      issueCount: validationResult.data.issues.length,
    });
  }

  const transformers = await createTransformers();
  const emitters = await createEmitters();
  const irHash = sha256(JSON.stringify(ir));
  const writes: PlannedWrite[] = [];
  const outDirAbsolute = resolve(process.cwd(), options.outDir);

  for (const target of targets) {
    const transformer = transformers.get(target);
    const emitter = emitters.get(target);

    if (!transformer || !emitter) {
      return {
        success: false,
        errors: [
          {
            code: "MISSING_TARGET_IMPL",
            message: `Missing transformer/emitter for ${target}`,
          },
        ],
      };
    }

    const transformResult = await transformer.transform(ir);
    if (!transformResult.success) {
      return transformResult;
    }

    const emitResult = await emitter.emit(transformResult.data);
    if (!emitResult.success) {
      return emitResult;
    }

    for (const file of emitResult.data) {
      const withHash: GeneratedFile = { ...file, irHash };
      const absolutePath = resolve(outDirAbsolute, target, withHash.path);
      const outputRelativePath = relative(outDirAbsolute, absolutePath);
      writes.push({ absolutePath, outputRelativePath, file: withHash });
    }
  }

  const existing = writes.filter((entry) => existsSync(entry.absolutePath));
  if (existing.length > 0 && options.force !== true) {
    const shouldOverwrite = await confirmOverwrite(
      existing.map((entry) => entry.outputRelativePath),
    );
    if (!shouldOverwrite) {
      return {
        success: false,
        errors: [
          {
            code: "OVERWRITE_CANCELLED",
            message: "Generation aborted by user; existing files were not overwritten",
            context: { existing: existing.length },
          },
        ],
      };
    }
  }

  for (const entry of writes) {
    mkdirSync(dirname(entry.absolutePath), { recursive: true });
    writeFileSync(entry.absolutePath, entry.file.content, "utf8");
  }

  const generatedAt = new Date().toISOString();
  const manifestPath = writeManifest(options.outDir, {
    runId: `${generatedAt}::${component}`,
    generatedAt,
    component,
    targets,
    irHash,
    fileCount: writes.length,
    files: writes.map((entry) => entry.outputRelativePath),
    ...(validationResult.success && {
      validation: {
        passed: validationResult.data.passed,
        issues: validationResult.data.issues.length,
      },
    }),
  });
  const relativeManifestPath = relative(outDirAbsolute, manifestPath);

  return {
    success: true,
    data: {
      component,
      targets,
      outDir: options.outDir,
      status: "generated",
      irHash,
      manifest: relativeManifestPath,
      files: writes.map((entry) => entry.outputRelativePath),
      ...(validationResult.success && {
        validation: {
          passed: validationResult.data.passed,
          issues: validationResult.data.issues.length,
        },
      }),
    },
  };
}

/**
 * foundry generate <component> --target react,vue
 *
 * Runs the full pipeline: ingest → analyze → transform → emit.
 */
export function generateCommand(): Command {
  return new Command("generate")
    .description("Generate framework implementations for a component")
    .argument("<component>", "Component name to generate")
    .option("-t, --target <frameworks>", "Comma-separated framework targets", "react")
    .option("--offline", "Use cached artifacts only")
    .option("--base-url <url>", "Registry base URL (overrides MCP config)")
    .option("--out-dir <dir>", "Output directory", "generated")
    .option("--cache-dir <dir>", "Cache directory", ".foundry/cache")
    .option("--force", "Overwrite existing generated files")
    .action(async (component: string, options: GenerateRunOptions) => {
      const result = await runGenerate(component, options);
      if (!result.success) {
        for (const error of result.errors) {
          logger.error(error.message, {
            code: error.code,
            path: error.path,
            context: error.context,
          });
        }
        process.exit(1);
      }

      process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
    });
}
