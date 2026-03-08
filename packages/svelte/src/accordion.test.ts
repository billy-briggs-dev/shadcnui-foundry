import { describe, expect, it } from "vitest";
import { nextOpenIds } from "./accordion.js";

describe("nextOpenIds", () => {
  it("opens one item for single mode", () => {
    expect(nextOpenIds([], "item-1", "single")).toEqual(["item-1"]);
  });

  it("toggles item for multiple mode", () => {
    expect(nextOpenIds(["item-1"], "item-2", "multiple")).toEqual(["item-1", "item-2"]);
    expect(nextOpenIds(["item-1", "item-2"], "item-2", "multiple")).toEqual(["item-1"]);
  });
});
