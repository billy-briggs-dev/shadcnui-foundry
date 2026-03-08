import "@angular/compiler";
import { describe, expect, it } from "vitest";
import { getButtonClassName } from "./button-utils.js";

describe("getButtonClassName", () => {
  it("uses default variant and size classes", () => {
    const className = getButtonClassName();
    expect(className).toContain("bg-primary");
    expect(className).toContain("h-9");
  });

  it("uses outline and sm classes", () => {
    const className = getButtonClassName("outline", "sm");
    expect(className).toContain("border-input");
    expect(className).toContain("h-8");
  });
});
