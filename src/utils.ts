// import type { Declaration } from "postcss";

// /^\(([\w-]+)(?:\s*:\s*([^)]+))?\)$/

export function getParams(text: string) {
  const regex = /\((.*?)\)/;
  const match = text.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
}


// type M = Map<string, string>

// export function mapper(target: M, source: M) {
//   target.forEach((value, property) => {
//     source.set(property, value)
//   })
// }


// export function create() {
//   const declarations = new Set<Declaration>();

//   for (const node of atRule.nodes) {
//     if (node.type === "decl") {
//       const { prop, value, important } = node;
//       const declaration = new Declaration({ prop, value, important })
//       declarations.add(declaration)
//     }
//   }

//   return declarations
// }