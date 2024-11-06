import type { PluginCreator, AtRule, Declaration } from "postcss";
import { Stash, Contains } from "./contains.js";
import { getParams } from "./utils.js";


interface PluginOptions {}


const plugin: PluginCreator<PluginOptions> = (opts?: PluginOptions) => {

  const stash = new Stash("merge");
  
  return {
    postcssPlugin: "postcss-contains",
    
    Once(root, { Declaration }) {

      root.walkAtRules("contains", (atRule: AtRule) => {
        const params = getParams(atRule.params);

        if (params === null) {
          console.log(params);
          return;
        }

        if (!atRule.nodes) {
          console.log(atRule, "no nodes");
          return;
        }

        const isPair = params.includes(":");
        const isSingle = !isPair;
        const overrides = atRule.params.includes("overrides");

        const invalidTypes = atRule.nodes.some(
          child => child.type === "rule" || child.type === "atrule"
        )

        if (invalidTypes) {
          console.log("WARNS: rules and at-rules can not be nested inside @contains");
          // return;
          // throw atRule.error("invalid node type: rules and at-rules can not be nested inside @contains")
        }

        if (isPair) {
          const [prop, value] = params.split(":").map((p) => p.trim());
          const declarations = new Map();

          for (const node of atRule.nodes) {
            if (node.type === "decl") {
              const { prop, value, important } = node;
              // const declaration = new Declaration({ prop, value, important })
              declarations.set(prop, value)
            }
          }

          const contains = new Contains(prop!, "pair", value)
          contains.set(declarations, overrides)
          stash.add(contains)
          atRule.remove()
          return;
        }

        if (isSingle) {
          const prop = params;
          const declarations = new Map();

          for (const node of atRule.nodes) {
            if (node.type === "decl") {
              const { prop, value, important } = node;
              // const declaration = new Declaration({ prop, value, important })
              declarations.set(prop, value)
            }
          }

          const contains = new Contains(prop!, "single")
          contains.set(declarations, overrides)
          stash.add(contains)
          atRule.remove()
          return;
        }
      });
    },

    Rule(rule, helper) {
      stash.start(rule)
      stash.process()
      stash.end()
    },
  };
}

plugin.postcss = true;

export default plugin;
