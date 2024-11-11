import postcss from "postcss"
import plug from "../src/index"

interface Options {
  duplication: "merge" | "replace"
}

const defaultOptions: Options = {
  duplication: "merge"
}

export async function process(css: string, options = defaultOptions) {
  const result = await postcss([plug(options)]).process(css, { from: undefined })
  return result.css
}

export async function warnings(css: string, options = defaultOptions) {
  const result = await postcss([plug(options)]).process(css, { from: undefined })
  return result.warnings();
}

export async function importer(url: string): Promise<string> {
  const result = await import(url)
  return result.default
}
