import { createHash } from "node:crypto";

/**
 * Compute a SHA-256 hash of a string, returning a hex digest.
 * Used for provenance tracking and cache invalidation.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Compute a stable hash of a ComponentIR object.
 * Serializes deterministically before hashing.
 */
export function hashObject(obj: unknown): string {
  return sha256(JSON.stringify(obj, Object.keys(obj as object).sort()));
}
