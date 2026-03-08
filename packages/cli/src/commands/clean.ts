import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";

const DEFAULT_TARGETS = [
  ".foundry/cache",
  "packages/cli/.foundry/cache",
  "packages/cli/.foundry/agent-jobs",
] as const;

export function runFoundryClean(targets: readonly string[] = DEFAULT_TARGETS): void {
  for (const target of targets) {
    rmSync(resolve(process.cwd(), target), { recursive: true, force: true });
  }
}

export function cleanCommand(): Command {
  return new Command("clean").description("Clean Foundry caches and handoff bundles").action(() => {
    runFoundryClean();
    process.stdout.write("Cleaned Foundry caches and handoff bundles.\n");
  });
}
