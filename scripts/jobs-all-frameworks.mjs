#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const FRAMEWORKS = ["react", "vue", "svelte", "angular", "lit"];
const SHARED_OUT_DIR = ".foundry/agent-jobs/_shared";

function parseArgs(argv) {
  const options = {
    component: "",
    offline: false,
    cacheDir: "",
    baseUrl: "",
    force: false,
    sharedCache: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!options.component && !token.startsWith("-")) {
      options.component = token;
      continue;
    }

    if (token === "--offline") {
      options.offline = true;
      continue;
    }

    if (token === "--cache-dir") {
      options.cacheDir = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (token === "--base-url") {
      options.baseUrl = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (token === "--force") {
      options.force = true;
      continue;
    }

    if (token === "--no-shared-cache") {
      options.sharedCache = false;
      continue;
    }
  }

  return options;
}

function showUsage() {
  console.error(
    "Usage: pnpm jobs:all <component> [--offline] [--cache-dir <dir>] [--base-url <url>] [--force] [--no-shared-cache]",
  );
}

const options = parseArgs(process.argv.slice(2));

if (!options.component) {
  showUsage();
  process.exit(1);
}

let generatedCount = 0;
let skippedCount = 0;
let sharedGenerated = false;

const pnpmExecPath = process.env.npm_execpath;
if (!pnpmExecPath) {
  console.error("Unable to resolve pnpm executable path from npm_execpath.");
  process.exit(1);
}

function runJobsCreate(framework, outDir, extraArgs = []) {
  const args = [
    "--filter",
    "@shadcnui-foundry/cli",
    "run",
    "foundry",
    "jobs-create",
    options.component,
    "--framework",
    framework,
    "--out-dir",
    outDir,
    ...extraArgs,
  ];

  if (options.offline) {
    args.push("--offline");
  }

  if (options.cacheDir) {
    args.push("--cache-dir", options.cacheDir);
  }

  if (options.baseUrl) {
    args.push("--base-url", options.baseUrl);
  }

  const result = spawnSync(process.execPath, [pnpmExecPath, ...args], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (options.sharedCache) {
  const sharedRunDir = join("packages", "cli", ".foundry", "agent-jobs", "_shared", options.component);
  const hasSharedBundle =
    existsSync(join(sharedRunDir, "artifact.json")) && existsSync(join(sharedRunDir, "ir.json"));

  if (hasSharedBundle && !options.force) {
    console.log(`\n=== shared cache: ${options.component} [cache hit: skipped] ===`);
  } else {
    console.log(`\n=== shared cache: ${options.component} [generating] ===`);
    runJobsCreate("react", SHARED_OUT_DIR);
    sharedGenerated = true;
  }
}

for (const framework of FRAMEWORKS) {
  const runDir = join("packages", "cli", ".foundry", "agent-jobs", framework, options.component);
  const hasBundle =
    existsSync(join(runDir, "artifact.json")) &&
    existsSync(join(runDir, "ir.json")) &&
    existsSync(join(runDir, "prompt.md"));

  if (hasBundle && !options.force) {
    skippedCount += 1;
    console.log(`\n=== jobs-create: ${options.component} (${framework}) [cache hit: skipped] ===`);
    continue;
  }

  console.log(`\n=== jobs-create: ${options.component} (${framework}) ===`);

  if (options.sharedCache) {
    runJobsCreate(framework, `.foundry/agent-jobs/${framework}`, ["--shared-input-dir", SHARED_OUT_DIR]);
  } else {
    runJobsCreate(framework, `.foundry/agent-jobs/${framework}`);
  }

  generatedCount += 1;
}

console.log(
  `\nAll framework job bundles processed successfully. Generated: ${generatedCount}, skipped (cache hit): ${skippedCount}, shared cache generated: ${sharedGenerated}.`,
);
