import { describe, expect, it } from "vitest";
import { getButtonClassName } from "./button.js";

describe("getButtonClassName", () => {
  it("uses default variant and size classes", () => {
    const className = getButtonClassName();
    expect(className).toContain("bg-primary");
    expect(className).toContain("h-9");
  });

  it("uses secondary and lg classes", () => {
    const className = getButtonClassName("secondary", "lg");
    expect(className).toContain("bg-secondary");
    expect(className).toContain("h-10");
  });
});
