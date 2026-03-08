import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RawRegistryArtifact } from "@shadcnui-foundry/core";
import { ShadcnRegistryItemSchema } from "@shadcnui-foundry/registry-ingest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runJobsCreate } from "./commands/jobs-create.js";

const cleanupDirs: string[] = [];

vi.mock("@shadcnui-foundry/registry-ingest", async (importOriginal) => {
  const original = await importOriginal<typeof import("@shadcnui-foundry/registry-ingest")>();

  class MockIngester {
    async ingest(componentName: string) {
      const artifact: RawRegistryArtifact = {
        name: componentName,
        content: {
          name: componentName,
          type: "registry:ui",
          files: [
            {
              path: "ui/mock.tsx",
              content: `export function ${componentName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}() { return null; }`,
            },
          ],
        },
        contentType: "json",
        sourceUrl: `https://example.test/${componentName}.json`,
        fetchedAt: "2026-03-07T00:00:00.000Z",
      };

      return { success: true as const, data: artifact };
    }
  }

  return {
    ...original,
    ShadcnRegistryIngester: MockIngester,
  };
});

vi.mock("@shadcnui-foundry/analyzer", () => {
  class MockAnalyzer {
    async analyze(artifact: RawRegistryArtifact) {
      return {
        success: true as const,
        data: {
          id: artifact.name,
          name: "Accordion",
          description: "Mock IR for testing job snapshots",
          category: "composite" as const,
          props: [
            {
              name: "type",
              type: "enum" as const,
              values: ["single", "multiple"],
              required: false,
              defaultValue: '"single"',
              forwarded: false,
            },
          ],
          variants: [
            {
              name: "size",
              values: ["sm", "md"],
              defaultValue: "md",
              strategy: "class" as const,
            },
          ],
          a11y: {
            roles: ["region"],
            requiredAttributes: [],
            optionalAttributes: ["aria-label"],
            keyboardInteractions: [],
            focusManagement: "none" as const,
            liveRegion: false,
            wcagCriteria: [],
          },
          dependencies: [],
          tags: ["test"],
          provenance: {
            registry: "shadcn/ui",
            registryName: artifact.name,
            fetchedAt: "2026-03-07T00:00:00.000Z",
            sourceUrl: "https://example.test/accordion.json",
          },
          generatedAt: "2026-03-07T00:00:00.000Z",
          irVersion: "1.0.0",
        },
      };
    }
  }

  return { ShadcnAnalyzer: MockAnalyzer };
});

afterEach(() => {
  for (const dir of cleanupDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function normalizePrompt(content: string): string {
  return content
    .replace(/`[^`]*artifact\.json`/g, "`<ARTIFACT_PATH>`")
    .replace(/`[^`]*ir\.json`/g, "`<IR_PATH>`");
}

describe("agent job bundle", () => {
  it("snapshots IR + prompt and validates artifact contract", async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "foundry-jobs-"));
    cleanupDirs.push(tmpRoot);

    const result = await runJobsCreate("accordion", {
      framework: "react",
      cacheDir: ".foundry/cache",
      outDir: tmpRoot,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const artifactRaw = readFileSync(result.data.output.artifact, "utf8");
    const irRaw = readFileSync(result.data.output.ir, "utf8");
    const promptRaw = readFileSync(result.data.output.prompt, "utf8");

    const artifact = JSON.parse(artifactRaw) as RawRegistryArtifact;
    const parsedArtifactContent = ShadcnRegistryItemSchema.safeParse(artifact.content);

    expect(parsedArtifactContent.success).toBe(true);
    expect(artifact).toEqual(
      expect.objectContaining({
        name: "accordion",
        contentType: "json",
        sourceUrl: expect.stringContaining("accordion.json"),
        fetchedAt: "2026-03-07T00:00:00.000Z",
      }),
    );

    const ir = JSON.parse(irRaw) as unknown;
    expect(ir).toMatchSnapshot();
    expect(normalizePrompt(promptRaw)).toMatchSnapshot();
  });
});
