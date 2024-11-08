import { describe, expect, test } from "vitest";
import { process } from "./index.js";

describe(`Issues; warning and errors`, () => {
  test("New line in the params", async () => {
    const input = `
    
    `;

    const output = `
    
    `;

    const result = await process(input);
    expect(result)
  });
});
