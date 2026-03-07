import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Ingester, RawRegistryArtifact } from "@shadcnui-foundry/core";
import type { PipelineResult } from "@shadcnui-foundry/ir";
import { ShadcnRegistryItemSchema } from "./schemas.js";

/**
 * Ingests components from a local directory of JSON registry artifacts.
 * Useful for offline development, testing, and cached artifact regeneration.
 */
export class LocalFileIngester implements Ingester {
  readonly name = "local-file";

  constructor(private readonly artifactsDir: string) {}

  async ingest(componentName: string): Promise<PipelineResult<RawRegistryArtifact>> {
    const filePath = join(this.artifactsDir, `${componentName}.json`);

    if (!existsSync(filePath)) {
      return {
        success: false,
        errors: [
          {
            code: "FILE_NOT_FOUND",
            message: `No local artifact for "${componentName}" at ${filePath}`,
          },
        ],
      };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (err) {
      return {
        success: false,
        errors: [{ code: "PARSE_ERROR", message: `Failed to parse ${filePath}: ${String(err)}` }],
      };
    }

    const parsed = ShadcnRegistryItemSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((e) => ({
          code: "SCHEMA_VALIDATION_ERROR",
          message: e.message,
          path: e.path.join("."),
        })),
      };
    }

    return {
      success: true,
      data: {
        name: componentName,
        content: parsed.data,
        contentType: "json",
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  async list(): Promise<PipelineResult<string[]>> {
    try {
      const files = readdirSync(this.artifactsDir);
      const names = files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
      return { success: true, data: names };
    } catch (err) {
      return {
        success: false,
        errors: [{ code: "DIR_READ_ERROR", message: String(err) }],
      };
    }
  }
}
