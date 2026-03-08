import { describe, expect, it } from "vitest";
import { getButtonClassName } from "./button.js";

describe("getButtonClassName", () => {
  it("uses default variant and size classes", () => {
    const className = getButtonClassName();
    expect(className).toContain("bg-primary");
    expect(className).toContain("h-9");
  });

  it("uses link and sm classes", () => {
    const className = getButtonClassName("link", "sm");
    expect(className).toContain("hover:underline");
    expect(className).toContain("h-8");
  });
});
