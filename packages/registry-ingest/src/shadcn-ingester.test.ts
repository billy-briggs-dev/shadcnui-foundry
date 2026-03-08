import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ShadcnRegistryIngester } from "./shadcn-ingester.js";

type RegistryFile = {
  path: string;
  content?: string;
};

type RegistryContent = {
  name?: string;
  type?: string;
  files?: RegistryFile[];
};

const cleanupDirs: string[] = [];

afterEach(() => {
  for (const dir of cleanupDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("ShadcnRegistryIngester CLI fallback", () => {
  it("falls back to shadcn CLI install and parses component files", async () => {
    const cacheDir = mkdtempSync(join(tmpdir(), "foundry-cache-"));
    cleanupDirs.push(cacheDir);

    const ingester = new ShadcnRegistryIngester({
      baseUrl: "https://invalid.example.test/registry",
      cacheDir,
      fetchImpl: async () => new Response("", { status: 503 }),
      cliFallbackRunner: (_component, workspaceDir) => {
        const uiDir = resolve(workspaceDir, "src", "components", "ui");
        mkdirSync(uiDir, { recursive: true });
        writeFileSync(
          resolve(uiDir, "button.tsx"),
          "export function Button(){return null}\n",
          "utf8",
        );

        return {
          status: 0,
          stdout: "ok",
          stderr: "",
        };
      },
    });

    const result = await ingester.ingest("button");
    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    const content = result.data.content as RegistryContent;
    expect(content.name).toBe("button");
    expect(content.type).toBe("registry:ui");
    expect(content.files?.some((file) => file.path.endsWith("src/components/ui/button.tsx"))).toBe(
      true,
    );
  });

  it("returns fallback error when CLI succeeds without component files", async () => {
    const cacheDir = mkdtempSync(join(tmpdir(), "foundry-cache-"));
    cleanupDirs.push(cacheDir);

    const ingester = new ShadcnRegistryIngester({
      baseUrl: "https://invalid.example.test/registry",
      cacheDir,
      fetchImpl: async () => new Response("", { status: 404 }),
      cliFallbackRunner: () => ({
        status: 0,
        stdout: "",
        stderr: "",
      }),
    });

    const result = await ingester.ingest("button");
    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.errors.some((error) => error.code === "CLI_FALLBACK_PARSE_ERROR")).toBe(true);
  });
});
