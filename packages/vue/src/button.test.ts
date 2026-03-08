import { describe, expect, it } from "vitest";
import { getButtonClassName } from "./button.js";

describe("getButtonClassName", () => {
  it("uses default variant and size classes", () => {
    const className = getButtonClassName();
    expect(className).toContain("bg-primary");
    expect(className).toContain("h-9");
  });

  it("uses ghost and icon classes", () => {
    const className = getButtonClassName("ghost", "icon");
    expect(className).toContain("hover:bg-accent");
    expect(className).toContain("w-9");
  });
});
