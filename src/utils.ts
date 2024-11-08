import type { Container } from "postcss";

// /^\(([\w-]+)(?:\s*:\s*([^)]+))?\)$/

export function getParams(params: string) {
  const regex = /\((.*?)\)/;
  const normed = params.trim().replace(/(\r\n|\n|\r)/gm,"").replace(/\t/g," ");
  const match = normed.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
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
  
  while (
    last?.type === "rule" ||
    last?.type === "atrule" ||
    last?.type === "comment"
  ) {
    last = last.prev();
  }

  return last;
}
