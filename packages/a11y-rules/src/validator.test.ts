import { createTestComponentIR, expectSuccess } from "@shadcnui-foundry/test-utils";
import { describe, expect, it } from "vitest";
import { A11yValidator } from "./validator.js";

describe("A11yValidator", () => {
  it("passes a well-described overlay component", async () => {
    const validator = new A11yValidator();
    const ir = createTestComponentIR({
      id: "dialog",
      category: "overlay",
      a11y: {
        roles: ["dialog"],
        requiredAttributes: ["aria-modal"],
        optionalAttributes: ["aria-labelledby"],
        keyboardInteractions: [
          { key: "Escape", description: "Close dialog" },
          { key: "Tab", description: "Move focus" },
        ],
        focusManagement: "trap",
        liveRegion: false,
        wcagCriteria: ["2.1.1", "2.4.3", "2.4.7", "4.1.2"],
      },
    });

    const result = await validator.validate(ir);
    const report = expectSuccess(result);

    expect(report.passed).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it("fails when overlay focus trap requirement is missing", async () => {
    const validator = new A11yValidator();
    const ir = createTestComponentIR({
      id: "dialog",
      category: "overlay",
      a11y: {
        roles: ["dialog"],
        requiredAttributes: ["aria-modal"],
        optionalAttributes: [],
        keyboardInteractions: [{ key: "Escape", description: "Close dialog" }],
        focusManagement: "restore",
        liveRegion: false,
        wcagCriteria: ["2.1.1", "2.4.3", "2.4.7", "4.1.2"],
      },
    });

    const result = await validator.validate(ir);
    const report = expectSuccess(result);

    expect(report.passed).toBe(false);
    expect(report.issues.some((issue) => issue.code === "A11Y002")).toBe(true);
  });

  it("reports invalid WCAG criterion formatting as an error", async () => {
    const validator = new A11yValidator();
    const ir = createTestComponentIR({
      id: "button",
      category: "primitive",
      a11y: {
        roles: ["button"],
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [
          { key: "Enter", description: "Activate" },
          { key: "Space", description: "Activate" },
        ],
        focusManagement: "none",
        liveRegion: false,
        wcagCriteria: ["2.1.1", "2.4", "4.1.2"],
      },
    });

    const result = await validator.validate(ir);
    const report = expectSuccess(result);

    expect(report.passed).toBe(false);
    expect(
      report.issues.some((issue) => issue.code === "A11Y005" && issue.severity === "error"),
    ).toBe(true);
  });

  it("reports missing WCAG keyboard and focus criteria for interactive components", async () => {
    const validator = new A11yValidator();
    const ir = createTestComponentIR({
      id: "button",
      category: "primitive",
      a11y: {
        roles: ["button"],
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [
          { key: "Enter", description: "Activate" },
          { key: "Space", description: "Activate" },
        ],
        focusManagement: "none",
        liveRegion: false,
        wcagCriteria: ["4.1.2"],
      },
    });

    const result = await validator.validate(ir);
    const report = expectSuccess(result);

    expect(report.issues.some((issue) => issue.code === "A11Y006")).toBe(true);
    expect(report.issues.some((issue) => issue.code === "A11Y007")).toBe(true);
  });

  it("reports live region criteria when status message mapping is missing", async () => {
    const validator = new A11yValidator();
    const ir = createTestComponentIR({
      id: "alert",
      category: "feedback",
      a11y: {
        roles: ["alert"],
        requiredAttributes: [],
        optionalAttributes: [],
        keyboardInteractions: [],
        focusManagement: "none",
        liveRegion: true,
        wcagCriteria: ["4.1.2"],
      },
    });

    const result = await validator.validate(ir);
    const report = expectSuccess(result);

    expect(report.issues.some((issue) => issue.code === "A11Y010")).toBe(true);
  });
});
