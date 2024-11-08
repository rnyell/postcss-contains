import type { PluginCreator, AtRule } from "postcss";
import Contains from "./contains.js";
import { getParams } from "./utils.js";


interface PluginOptions {
  duplication: "merge" | "replace"
}


const plugin: PluginCreator<PluginOptions> = (opts?: PluginOptions) => {
  const defaults: PluginOptions = { duplication: "merge" }
  const options = Object.assign(defaults, opts)

  const contains = new Contains(options.duplication);
  
  return {
    postcssPlugin: "postcss-contains",
    
    Once(root, { result }) {

      root.walkAtRules("contains", (atRule: AtRule) => {
        const params = getParams(atRule.params);
        const overrides = atRule.params.startsWith("overrides");

        if (params === null) {
          console.log(params);
          return;
        }

        if (!atRule.nodes) {
          console.log(atRule, "no nodes");
          return;
        }

        const isInvalidType = atRule.nodes.some(child => 
          child.type === "rule" || child.type === "atrule"
        );

        if (isInvalidType) {
          atRule.warn(result, "WARNS: rules and at-rules can not be nested inside @contains");
          // throw atRule.error("invalid node type: rules and at-rules can not be nested inside @contains");
          return;
        }

        const isPair = params.includes(":");
        const isSingle = !isPair;

        if (isPair) {
          const [property, value] = params.split(":").map((p) => p.trim());
          const variant: "pair" | "single" = "pair"
          const declarations = new Map<string, string>();

          if (!property || !value) {
            console.log("(property: value) --> undefined", property, value);
            return;
          }

          for (const node of atRule.nodes) {
            if (node.type === "decl") {
              const { prop, value, important } = node;
              // const declaration = new Declaration({ prop, value, important })
              declarations.set(prop, value)
            }
          }

          const bucket = { value, variant, overrides, declarations }
          contains.add(property, bucket)
          atRule.remove()
          return;
        }

        if (isSingle) {
          const property = params;
          const variant: "pair" | "single" = "single"
          const declarations = new Map<string, string>();

          if (!property) {
            console.log("(property) --> undefined", property);
            return;
          }

          for (const node of atRule.nodes) {
            if (node.type === "decl") {
              const { prop, value, important } = node;
              declarations.set(prop, value)
            }
          }

          const bucket = { value: null, variant, overrides, declarations }
          contains.add(property, bucket)
          atRule.remove()
          return;
        }
      });
    },

    Rule(rule) {
      contains.start(rule)
      contains.process()
      contains.end()
    },

    OnceExit() {
      contains.reset();
    }
  };
}

plugin.postcss = true;

export default plugin;
