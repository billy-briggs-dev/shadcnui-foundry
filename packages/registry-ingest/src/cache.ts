import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Simple file-based cache for registry artifacts.
 * Supports offline regeneration from cached data.
 */
export class ArtifactCache {
  private readonly cacheDir: string;

  constructor(cacheDir = ".foundry/cache") {
    this.cacheDir = cacheDir;
    mkdirSync(this.cacheDir, { recursive: true });
  }

  private key(namespace: string, id: string): string {
    const hash = createHash("sha256").update(`${namespace}:${id}`).digest("hex").slice(0, 12);
    return join(this.cacheDir, `${namespace}_${hash}.json`);
  }

  get<T>(namespace: string, id: string): T | null {
    const path = this.key(namespace, id);
    if (!existsSync(path)) return null;
    try {
      const raw = readFileSync(path, "utf8");
      const entry = JSON.parse(raw) as { data: T; cachedAt: string };
      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(namespace: string, id: string, data: T): void {
    const path = this.key(namespace, id);
    writeFileSync(
      path,
      JSON.stringify({ data, cachedAt: new Date().toISOString() }, null, 2),
      "utf8",
    );
  }

  has(namespace: string, id: string): boolean {
    return existsSync(this.key(namespace, id));
  }

  clear(namespace: string, id: string): void {
    const path = this.key(namespace, id);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }
}
