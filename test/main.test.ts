// import { debug } from "vitest-preview"
import { describe, expect, test } from "vitest";
import { process } from "./index.js";

/**
 * These tested examples are not affected by the `option` that is passed to the plugin.
 * To see examples based on different options check "options.test.ts"
 */

describe(`Main examples without duplication case`, () => {
  test("Basic usage — 1", async () => {
    const input = `
      @contains (display: flex) {
        align-items: center;
        gap: 5px;
      }

      div {
        display: flex;
      }
    `;

    const output = `
      div {
        display: flex;
        align-items: center;
        gap: 5px;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Basic usage — 2", async () => {
    const input = `
      @contains (position) {
        isolation: isolate;
      }

      @contains (display: grid) {
        grid-auto-flow: column;
      }

      header {
        position: fixed;
      }

      div {
        position: relative;
        display: grid;
      }
    `;

    const output = `
      header {
        position: fixed;
        isolation: isolate;
      }

      div {
        position: relative;
        display: grid;
        isolation: isolate;
        grid-auto-flow: column;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Style Conflict between one @contains and one selector", async () => {
    const input = `
      @contains overrides (display: inline-block) {
        padding: 1rem;
        color: red;
      }

      div {
        display: inline-block;
        color: blue;
      }
    `;

    const output = `
      div {
        display: inline-block;
        padding: 1rem;
        color: red;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Style conflict between two single-type contains", async () => {
    const input = `
      @contains (position) {
        align-items: center;
      }

      @contains (display) {
        align-items: stretch;
      }

      div {
        position: relative;
        display: flex;
      }
    `;

    const output = `
      div {
        position: relative;
        display: flex;
        align-items: stretch;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Specificity; conflict between three @contains", async () => {
    const input = `
      @contains (display) {
        color: red;
      }

      @contains (display: block) {
        color: blue;
      }

      @contains (overflow: hidden) {
        color: green;
      }

      span {
        overflow: hidden;
        display: block;
      }
    `;

    const output = `
      span {
        overflow: hidden;
        display: block;
        color: blue;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Conflict between single=type & pair-type contains", async () => {
    const input = `
      @contains overrides (padding) {
        margin: 0;
        color: black;
        border: none;
      }

      @contains (padding: 1rem) {
        border: 2px dashed;
        color: white;
      }

      div {
        margin: 5px;
        padding: 1rem;
        border: 1px solid;
      }
    `;

    const output = `
      div {
        padding: 1rem;
        border: 1px solid;
        margin: 0;
        color: white;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Conflict between single-type & pair-type @contains", async () => {
    const input = `
      @contains overrides (padding) {
        margin: 0;
        color: black;
        border: none;
      }

      @contains (padding: 1rem) {
        border: 2px dashed;
        color: white;
      }

      div {
        margin: 5px;
        padding: 1rem;
        border: 1px solid;
      }
    `;

    const output = `
      div {
        padding: 1rem;
        border: 1px solid;
        margin: 0;
        color: white;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });

  test("Pretty complex example", async () => {
    const input = `
      @contains (padding: 1rem) {
        display: grid;
        color: white;
        border: 2px dashed;
      }

      @contains overrides (padding) {
        margin: 0;
        overflow: scroll;
        will-change: transform;
        border: none;
      }

      @contains overrides (display: flex) {
        box-sizing: content-box;
        overflow: hidden;
        gap: 1rem;
      }

      @contains (display) {
        position: relative;
        z-index: 0;
      }

      @contains overrides (color) {
        display: block;
        color: unset;
        border: 4px solid;
      }

      div {
        margin: 5px;
        padding: 1rem;
        display: flex;
        gap: 0;
        color: limegreen;
        border: 1px solid;
      }
    `;

    const output = `
      div {
        padding: 1rem;
        display: flex;
        color: limegreen;
        border: 1px solid;
        margin: 0;
        overflow: hidden;
        will-change: transform;
        box-sizing: content-box;
        gap: 1rem;
        position: relative;
        z-index: 0;
      }
    `;

    const result = await process(input);
    expect(result).toBe(output);
  });
});
