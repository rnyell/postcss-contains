import type { PluginCreator } from "postcss";
import Contains from "./contains.js";

interface PluginOptions {
  duplication: "merge" | "replace";
}

const plugin: PluginCreator<PluginOptions> = (opts?: PluginOptions) => {
  const defaults: PluginOptions = { duplication: "merge" };
  const options = Object.assign(defaults, opts);

  const contains = new Contains(options.duplication);

  return {
    postcssPlugin: "postcss-contains",

    Once(root, { result }) {
      contains.collect(root, result);
    },

    Rule(rule) {
      contains.start(rule);
      contains.process();
      contains.end();
    },

    OnceExit() {
      contains.reset();
    },
  };
};

plugin.postcss = true;

export default plugin;
