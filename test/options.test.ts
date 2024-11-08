import { describe, expect, test } from "vitest";
import { process } from "./index.js";

/**
 * When contains are duplicated the `duplication` option determines how they should be resolved:
 *    duplication: "merge"    -> merge them into one
 *    duplication: "replace"  -> replace the previous one with the new one
 */

describe(`Testing different options`, () => {
  test("Duplications; between two single-type contains", async () => {
    const input = `
      @contains (padding) {
        margin: 1rem;
        color: pink;
      }

      @contains (padding) {
        color: red;
        border: 0;
      }

      div {
        padding: 0.5rem 1rem;
      }
    `;

    const output = `
      div {
        padding: 0.5rem 1rem;
        margin: 1rem;
        color: red;
        border: 0;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Duplications; on pair-type; if one of them includes 'overrides` the merged styles also gets 'overrides'", async () => {
    const input = `
      @contains overrides (display: grid) {
        padding: 1rem;
        margin: 0;
      }

      @contains (display: grid) {
        color: green;
      }

      div {
        margin: 8px;
        display: grid;
        color: blue;
      }
    `;

    const output = `
      div {
        display: grid;
        padding: 1rem;
        margin: 0;
        color: green;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Duplications; on single-type", async () => {
    const input = `
      @contains (padding) {
        margin: 1rem;
        color: pink;
      }
      
      @contains (padding) {
        color: red;
        border: 0;
      }
      
      div {
        padding: 0.5rem 1rem;
      }
    `;

    const output = `
      div {
        padding: 0.5rem 1rem;
        color: red;
        border: 0;
      }
    `;

    const result = await process(input, { duplication: "replace" });
    expect(result).toBe(output);
  });

  test("Duplications; on pair-type", async () => {
    const input = `
      @contains (display: flex) {
        margin: 1rem;
        color: pink;
      }
      
      @contains (display: flex) {
        color: red;
        border: 0;
      }
      
      div {
        display: flex;
      }
    `;

    const output = `
      div {
        display: flex;
        color: red;
        border: 0;
      }
    `;

    const result = await process(input, { duplication: "replace" });
    expect(result).toBe(output);
  });

  test("Duplications on pair-type. showing overrides has nothing to do with duplication, \
    but it's related when a @contains and a selector has conflitc", async () => {
    const input = `
      @contains overrides (display: grid) {
        padding: 1rem;
        color: red;
        margin: 0;
      }

      @contains (display: grid) {
        margin: 1rem;
        color: blue;
      }

      div {
        margin: 8px;
        display: grid;
      }
    `;

    const output = `
      div {
        margin: 8px;
        display: grid;
        color: blue;
      }
    `;

    const result = await process(input, { duplication: "replace" });
    expect(result).toBe(output);
  });

  test("Duplications on pair-type; the 'overrides' will be included in the merged styles", async () => {
    const input = `
      @contains overrides (display: grid) {
        padding: 1rem;
        color: red;
        margin: 0;
      }

      @contains (display: grid) {
        margin: 1rem;
        color: blue;
      }

      div {
        margin: 8px;
        display: grid;
      }
    `;

    const output = `
      div {
        display: grid;
        padding: 1rem;
        color: blue;
        margin: 1rem;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });
});
