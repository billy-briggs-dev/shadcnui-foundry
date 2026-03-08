import { describe, expect, it } from "vitest";
import { getButtonClassName } from "./button.js";

describe("getButtonClassName", () => {
  it("uses default variant and size classes", () => {
    const className = getButtonClassName();
    expect(className).toContain("bg-primary");
    expect(className).toContain("h-9");
  });

  it("uses destructive and lg classes", () => {
    const className = getButtonClassName("destructive", "lg");
    expect(className).toContain("bg-destructive");
    expect(className).toContain("h-10");
  });
});
