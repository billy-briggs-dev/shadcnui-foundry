import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";

const FRAMEWORKS = ["react", "vue", "svelte", "angular", "lit"] as const;

type AgentJob = {
  framework: (typeof FRAMEWORKS)[number];
  component: string;
  runDir: string;
  prompt: string;
  ir: string;
  artifact: string;
};

function listFrameworkJobs(
  rootDir: string,
  framework: (typeof FRAMEWORKS)[number],
  componentFilter?: string,
): AgentJob[] {
  const frameworkDir = join(rootDir, framework);
  if (!existsSync(frameworkDir)) {
    return [];
  }

  const componentDirs = readdirSync(frameworkDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return componentDirs
    .filter((component) => (componentFilter ? component === componentFilter : true))
    .map((component) => {
      const runDir = join(frameworkDir, component);
      return {
        framework,
        component,
        runDir,
        prompt: join(runDir, "prompt.md"),
        ir: join(runDir, "ir.json"),
        artifact: join(runDir, "artifact.json"),
      };
    });
}

export function listAgentJobs(
  componentFilter?: string,
  baseDir = ".foundry/agent-jobs",
): AgentJob[] {
  const rootDir = resolve(process.cwd(), baseDir);
  return FRAMEWORKS.flatMap((framework) => listFrameworkJobs(rootDir, framework, componentFilter));
}

export function jobsCommand(): Command {
  return new Command("jobs")
    .description("List framework-scoped agent jobs")
    .argument("[component]", "Optional component name filter")
    .option("--base-dir <dir>", "Agent jobs directory", ".foundry/agent-jobs")
    .action((component: string | undefined, options: { baseDir: string }) => {
      const jobs = listAgentJobs(component, options.baseDir);

      if (jobs.length === 0) {
        if (component) {
          process.stdout.write(`No agent jobs found for component: ${component}\n`);
        } else {
          process.stdout.write("No framework-scoped agent jobs found.\n");
        }
        return;
      }

      for (const job of jobs) {
        process.stdout.write(`framework=${job.framework} component=${job.component}\n`);
        process.stdout.write(`  runDir: ${job.runDir}\n`);
        process.stdout.write(`  prompt: ${job.prompt}\n`);
        process.stdout.write(`  ir: ${job.ir}\n`);
        process.stdout.write(`  artifact: ${job.artifact}\n`);
      }

      process.stdout.write(`\nTotal jobs: ${jobs.length}\n`);
    });
}
