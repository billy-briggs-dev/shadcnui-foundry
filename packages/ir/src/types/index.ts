export type { ComponentIR, ComponentCategory, Provenance } from "../schemas/component.js";
export type { Prop, PropType } from "../schemas/prop.js";
export type { Variant } from "../schemas/variant.js";
export type { DesignToken, TokenCategory } from "../schemas/token.js";
export type { A11y } from "../schemas/a11y.js";

/**
 * Result of a pipeline stage.
 * Represents either success with a value or failure with errors.
 */
export type PipelineResult<T> =
  | { success: true; data: T }
  | { success: false; errors: PipelineError[] };

export type PipelineError = {
  code: string;
  message: string;
  path?: string;
  context?: Record<string, unknown>;
};

/**
 * Framework targets supported by the generation pipeline.
 */
export type FrameworkTarget = "react" | "vue" | "svelte" | "angular" | "lit";

/**
 * A generated file artifact from the emit stage.
 */
export type GeneratedFile = {
  /** Relative path for the output file */
  path: string;
  /** File content */
  content: string;
  /** Source component IR id */
  componentId: string;
  /** Target framework */
  framework: FrameworkTarget;
  /** Whether this file was auto-generated (adds header comment) */
  generated: true;
  /** Hash of the IR used to generate this file */
  irHash: string;
};
