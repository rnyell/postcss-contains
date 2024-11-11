import type { Container } from "postcss";


export function getParams(params: string) {
  if (params.includes(";")) {
    throw new Error(`Semicolons are not allowed inside @contains params. ${params}`);
  }

  const regex = /\((.*?)\)/;

  const normed = params
    .trim()
    .replace(/(\r\n|\n|\r)/gm,"")
    .replace(/\t/g," ");

  const match = normed.match(regex);

  if (match && match[0]) {
    return match[0];
  } else {
    throw new Error("No proper params is passed to @contains");
  }
}


export function extract(params: string, variant: "pair" | "single") {
  switch (variant) {
    case "pair": {
      const re = /\(\s*(?<property>[a-zA-z0-9_+*-]*\s*):(?<value>.+)\s*\)/m;
      const match = params.match(re);

      if (!match || !match.groups) {
        throw new Error(`Syntax Error on \n\t >>> ${params} \n\t using new line or semicolon inside parenthesis is not allowed.`);
      }

      const property = match.groups.property?.trim();
      const value = match.groups.value?.trim();
      return { property, value };
    }
    case "single": {
      const re = /\(\s*(?<property>[a-zA-z0-9_+*-]*\s*)\)/m;
      const match = params.match(re);

      if (!match || !match.groups) {
        throw new Error(`Syntax Error on \n\t >>> ${params} \n\t using new line or semicolon inside parenthesis is not allowed.`);
      }

      const property = match.groups.property?.trim();

      if (property === "") {
        throw new Error(`The @contains params is empty: ${params}`);
      }

      return { property };
    }
  }
}


export function lastDecl(container: Container) {
  let last = container.last;

  if (!last) {
    return undefined;
  }

  if (last.type === "decl") {
    return last;
  }
  
  while (last?.type !== "decl") {
    last = last?.prev();
  }

  return last;
}
