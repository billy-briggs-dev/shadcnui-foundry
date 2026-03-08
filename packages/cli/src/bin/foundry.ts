#!/usr/bin/env node
/**
 * @generated false
 * @description Entry point for the foundry CLI.
 */
import { Command } from "commander";
import { cleanCommand } from "../commands/clean.js";
import { jobsCreateAllCommand } from "../commands/jobs-create-all.js";
import { jobsCreateCommand, runJobsCreate } from "../commands/jobs-create.js";
import { jobsCommand } from "../commands/jobs.js";

const program = new Command();
const DEFAULT_FRAMEWORKS = ["react", "vue", "svelte", "angular", "lit"] as const;
const DEFAULT_SHARED_OUT_DIR = ".foundry/agent-jobs/_shared";

program
  .name("foundry")
  .description("shadcnui-foundry — prompt-first component job pipeline")
  .version("0.0.0");

program
  .argument("[component]", "Default action: create agent job bundles for all frameworks")
  .action(async (component: string | undefined) => {
    if (!component) {
      return;
    }

    const sharedResult = await runJobsCreate(component, {
      framework: "react",
      cacheDir: ".foundry/cache",
      outDir: DEFAULT_SHARED_OUT_DIR,
    });

    if (!sharedResult.success) {
      for (const error of sharedResult.errors) {
        process.stderr.write(`${error.code}: ${error.message}\n`);
      }
      process.exit(1);
    }

    const bundles = [];

    for (const framework of DEFAULT_FRAMEWORKS) {
      const result = await runJobsCreate(component, {
        framework,
        cacheDir: ".foundry/cache",
        outDir: `.foundry/agent-jobs/${framework}`,
        sharedInputDir: DEFAULT_SHARED_OUT_DIR,
      });

      if (!result.success) {
        for (const error of result.errors) {
          process.stderr.write(`${error.code}: ${error.message}\n`);
        }
        process.exit(1);
      }

      bundles.push(result.data);
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          status: "ready",
          component,
          frameworks: DEFAULT_FRAMEWORKS,
          bundles,
        },
        null,
        2,
      )}\n`,
    );
  });

program.addCommand(jobsCreateCommand());
program.addCommand(jobsCreateAllCommand());
program.addCommand(cleanCommand());
program.addCommand(jobsCommand());

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`Error: ${String(err)}\n`);
  process.exit(1);
});
