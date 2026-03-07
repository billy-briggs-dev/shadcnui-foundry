import type { ComponentIR, PipelineResult } from "@shadcnui-foundry/ir";
import type { IRValidator, ValidationReport } from "@shadcnui-foundry/core";
import { A11Y_RULES } from "./rules.js";

export class A11yValidator implements IRValidator {
  async validate(ir: ComponentIR): Promise<PipelineResult<ValidationReport>> {
    const issues = A11Y_RULES.flatMap((rule) => rule.check(ir));
    const hasErrors = issues.some((i) => i.severity === "error");

    return {
      success: true,
      data: {
        componentId: ir.id,
        passed: !hasErrors,
        issues,
      },
    };
  }
}
