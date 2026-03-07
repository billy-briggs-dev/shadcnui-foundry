import { expect } from "vitest";
import type { PipelineResult } from "@shadcnui-foundry/ir";

/**
 * Asserts that a PipelineResult is successful and returns the data.
 */
export function expectSuccess<T>(result: PipelineResult<T>): T {
  if (!result.success) {
    const errorMessages = result.errors.map((e) => `[${e.code}] ${e.message}`).join(", ");
    expect.fail(`Expected pipeline success but got errors: ${errorMessages}`);
  }
  return result.data;
}

/**
 * Asserts that a PipelineResult is a failure.
 */
export function expectFailure<T>(result: PipelineResult<T>): void {
  expect(result.success).toBe(false);
}
