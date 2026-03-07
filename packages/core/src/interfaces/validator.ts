import type { ComponentIR, GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
};

export type ValidationReport = {
  componentId: string;
  passed: boolean;
  issues: ValidationIssue[];
};

/**
 * Validator interface — validates component IR or generated files.
 */
export interface IRValidator {
  validate(ir: ComponentIR): Promise<PipelineResult<ValidationReport>>;
}

export interface OutputValidator {
  validate(files: GeneratedFile[]): Promise<PipelineResult<ValidationReport>>;
}
