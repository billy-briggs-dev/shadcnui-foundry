#!/usr/bin/env node
/**
 * @generated false
 * @description Entry point for the foundry CLI.
 */
import { Command } from "commander";
import { ingestCommand } from "../commands/ingest.js";
import { generateCommand } from "../commands/generate.js";
import { listCommand } from "../commands/list.js";

const program = new Command();

program
  .name("foundry")
  .description("shadcnui-foundry — multi-framework component generation pipeline")
  .version("0.0.0");

program.addCommand(ingestCommand());
program.addCommand(generateCommand());
program.addCommand(listCommand());

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`Error: ${String(err)}\n`);
  process.exit(1);
});
