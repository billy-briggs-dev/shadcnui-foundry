import { createHash } from "node:crypto";

/**
 * Compute a SHA-256 hash of a string, returning a hex digest.
 * Used for provenance tracking and cache invalidation.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Recursively sort object keys for deterministic serialization.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Compute a stable hash of an object.
 * Recursively sorts keys before serializing to ensure deterministic output.
 */
export function hashObject(obj: unknown): string {
  return sha256(JSON.stringify(sortKeys(obj)));
}
