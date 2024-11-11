import { describe, expect, test } from "vitest";
import { extract, getParams } from "../src/utils.js";
import { warnings, process } from "./index.js";

describe("Issues; Warns", () => {
  test("Empty @contains (contains with no styles)", async () => {
    const input = `@contains (margin) {}`;
    const warns = await warnings(input);
    expect(warns).toHaveLength(1);
    expect(warns[0].text).toBe("The @contains was empty; it provides no styles.");
  });

  test("Using new lines inside params", async () => {
    const input = `
      @contains (
        display: flex) {
        /* styles */
      }
    `;

    const warns = await warnings(input);
    expect(warns).toHaveLength(1);
    expect(warns[0].text).toBe(
      "It's better to not use new lines inside @contains params.",
    );
  });
});

describe("Issues; Errors", () => {
  test("Nesting rule or at-rules inside contains.", async () => {
    const input = `
      @contains (scroll-snap-type) {
        overflow: scroll;
        &:hover {/*nested rule*/}
      }
    `;

    await expect(() => process(input)).rejects.toThrowError();
  });

  test("@contains without styles (curly brackets)", async () => {
    const input = `@contains (gap) `;
    await expect(() => process(input)).rejects.toThrowError();
  });

  test("Not closed curly brackets)", async () => {
    const input = `@contains (gap) {`;
    await expect(() => process(input)).rejects.toThrowError();
  });

  test("No property or declaration passed to @contains params (empty params)", () => {
    const atRuleParams = "()";
    const params = getParams(atRuleParams);
    expect(() => extract(params, "single")).toThrowError();
    expect(() => extract(params, "pair")).toThrowError();
  });

  test("Using semicolon inside params.", () => {
    const atRuleParams = "(padding;)";
    expect(() => getParams(atRuleParams)).toThrowError();
  });

  test("Misusing properties", () => {
    const atRuleParams = "(mar gin: 1rem)";
    const params = getParams(atRuleParams);
    expect(() => extract(params, "pair")).toThrowError();
  });

  test("Misusing properties", () => {
    const atRuleParams = "(mar gin)";
    const params = getParams(atRuleParams);
    expect(() => extract(params, "pair")).toThrowError();
  });
});
