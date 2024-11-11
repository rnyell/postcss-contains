import type { Container, Root, AtRule, Result } from "postcss";
import { extract, getParams, lastDecl } from "./utils.js";

type Duplication = "merge" | "replace";

type Variant = "pair" | "single";

type Bucket = {
  variant: Variant;
  value: string | null;
  overrides?: boolean;
  declarations: Map<string, string>;
};

// type Bucket<T extends Variant> = {
//   variant: T;
//   value: T extends "single" ? string | undefined : string;
//   overrides?: boolean;
//   declarations: Map<string, string>;
// };

type Pile = {
  variant: Variant;
  overrides?: boolean;
  declarations: Map<string, string>;
};

type Vals = {
  variant: Variant;
  value: string;
  overrides: boolean | undefined;
};

type Pack = {
  property: string;
  bucket: Bucket;
};

type Store = Set<Pack>;

const STORE: Store = new Set();

class Pairs {
  #duplication: Duplication = "merge";
  properties: string[] = [];
  buckets: Bucket[] = [];
  static indices: number[] = []; // holds the indices of matched properties temply
  static duplicatedIndex: number | null; // holde duplicated index temply

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket) {
    const isDuplicated = this.isDuplicated(property, bucket);

    if (isDuplicated) {
      this.resolve(bucket);
      return;
    }

    this.properties.push(property);
    this.buckets.push(bucket);
    STORE.add({ property, bucket });
  }

  isDuplicated(property: string, bucket: Bucket) {
    this.properties.forEach((p, i) => {
      if (p === property) {
        Pairs.indices.push(i);
      }
    });

    for (const index of Pairs.indices) {
      if (this.buckets[index]?.value === bucket.value) {
        Pairs.duplicatedIndex = index;
        return true;
      }
    }

    return false;
  }

  resolve(bucket: Bucket) {
    let oldBucket = this.buckets[Pairs.duplicatedIndex!]; //!
    let oldDecls = oldBucket?.declarations;
    let newDecls = bucket.declarations;

    if (oldDecls) {
      if (this.#duplication === "merge") {
        const mergedDecls = new Map([...oldDecls, ...newDecls]);
        oldBucket!.declarations = mergedDecls; //!
        oldBucket!.overrides = oldBucket?.overrides || bucket?.overrides; //!
      } else {
        oldBucket!.declarations = newDecls; //!
        oldBucket!.overrides = bucket.overrides; //!
      }
    }

    Pairs.indices = [];
    Pairs.duplicatedIndex = null;
  }

  reset() {
    this.properties = [];
    this.buckets = [];
  }
}

class Singles {
  #duplication: Duplication = "merge";
  #piles = new Map<string, Pile>(); //+ Wrrr: "V" is `Pile` but we are sending `Bucket`
  static duplicatedProperty: string | null;

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket) {
    const isDuplicated = this.isDuplicated(property);

    if (isDuplicated) {
      this.resolve(bucket);
      return;
    }

    this.#piles.set(property, bucket);
    STORE.add({ property, bucket });
  }

  isDuplicated(property: string) {
    if (this.#piles.has(property)) {
      Singles.duplicatedProperty = property;
      return true;
    } else {
      return false;
    }
  }

  resolve(bucket: Bucket) {
    const property = Singles.duplicatedProperty;

    if (property) {
      let oldBucket = this.#piles.get(property);
      let oldDecls = this.#piles.get(property)?.declarations;
      let newDecls = bucket.declarations;

      if (oldDecls) {
        if (this.#duplication === "merge") {
          let mergedDecls = new Map([...oldDecls, ...newDecls]);
          oldBucket!.declarations = mergedDecls; //!
          oldBucket!.overrides = oldBucket!.overrides || bucket.overrides; //!
        } else {
          oldBucket!.declarations = bucket.declarations; //!
          oldBucket!.overrides = bucket.overrides; //!
        }
      }
    }

    Singles.duplicatedProperty = null;
  }

  reset() {
    this.#piles.clear();
  }
}

export default class Contains {
  #duplication: Duplication = "merge";
  #container: Container | undefined;
  #pairs;
  #singles;
  static declarations = new Map<string, Vals>(); // holds all containers' decls temporarily

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
    this.#singles = new Singles(this.#duplication);
    this.#pairs = new Pairs(this.#duplication);
  }

  // 1) collecting all @contains: conditions and their declarations
  collect(root: Root, result: Result) {
    root.walkAtRules("contains", (atRule: AtRule) => {
      const params = getParams(atRule.params);
      const overrides = atRule.params.startsWith("overrides");

      if (/\n/.test(atRule.params)) {
        atRule.warn(
          result,
          "It's better to not use new lines inside @contains params.",
        );
      }

      if (!atRule.nodes) {
        throw new Error(
          `@contains has no styles (provided no curly brackets).\n   ${atRule.toString()}`,
        );
      }

      if (atRule.nodes.length === 0) {
        atRule.warn(result, `The @contains was empty; it provides no styles.`);
      }

      const isInvalidType = atRule.nodes.some(
        (child) => child.type === "rule" || child.type === "atrule",
      );

      if (isInvalidType) {
        throw new Error(
          `rules and at-rules can not be nested inside @contains.\n   ${atRule.toString()}`,
        );
      }

      if (params.includes(":")) {
        const { property, value } = extract(params, "pair");

        if (!property || !value) {
          throw new Error(
            `Something went wrong on \t ${atRule.toString()} \n\t >>> property: ${property} - value: ${value}`,
          );
        }

        const variant: "pair" | "single" = "pair";
        const declarations = new Map<string, string>();

        for (const node of atRule.nodes) {
          if (node.type === "decl") {
            const { prop, value, important } = node;
            // const declaration = new Declaration({ prop, value, important });
            declarations.set(prop, value);
          }
        }

        const bucket = { value, variant, overrides, declarations };
        this.add(property, bucket);
        atRule.remove();
        return;
      } else {
        const { property } = extract(params, "single");

        if (!property) {
          throw new Error(
            `Something went wrong on \t ${atRule.toString()} \n\t >>> property: ${property}`,
          );
        }

        const variant: "pair" | "single" = "single";
        const declarations = new Map<string, string>();

        for (const node of atRule.nodes) {
          if (node.type === "decl") {
            const { prop, value, important } = node;
            declarations.set(prop, value);
          }
        }

        const bucket = { value: null, variant, overrides, declarations };
        this.add(property, bucket);
        atRule.remove();
        return;
      }
    });
  }

  add(property: string, bucket: Bucket) {
    if (bucket.variant === "pair") {
      this.#pairs.add(property, bucket);
    } else if (bucket.variant === "single") {
      this.#singles.add(property, bucket);
    }
  }

  // 2) check each rule to find matches property/declaration
  find() {
    let found: boolean | undefined;

    // #container can't be `undefined` here, so `!` is used //!
    this.#container!.each((child) => {
      if (child.type === "decl") {
        for (const pack of STORE) {
          const property = pack.property;
          const bucket = pack.bucket;

          if (bucket.variant === "pair") {
            if (child.prop === property && child.value === bucket.value) {
              Contains.setDecls(bucket);
              found = true;
            }
          } else if (bucket.variant === "single") {
            if (child.prop === property) {
              Contains.setDecls(bucket);
              found = true;
            }
          }
        }
      } else {
        return;
      }
    });

    return found;
  }

  static setDecls(bucket: Bucket) {
    let variant = bucket.variant;
    let overrides = bucket.overrides;
    let declarations = bucket.declarations;

    for (const [property, value] of declarations) {
      /**
       * if a property already exist:
       *  - the "pair" one should overwrite the "single" one
       *  - the later "pair" should overwrite the previous one
       */
      if (this.declarations.has(property)) {
        const existingVariant = this.declarations.get(property)?.variant;
        if (existingVariant === "pair" && variant === "single") {
          continue;
        } else {
          const val = { value, overrides, variant };
          this.declarations.set(property, val);
        }
      } else {
        const val = { value, overrides, variant };
        this.declarations.set(property, val);
      }
    }
  }

  // 3) processe and mutate nodes
  start(container: Container) {
    this.#container = container;
  }

  process() {
    const found = this.find();

    if (found) {
      this.#container?.each((child) => {
        if (child.type === "decl") {
          if (Contains.declarations.has(child.prop)) {
            const vals = Contains.declarations.get(child.prop);
            if (vals?.overrides) {
              child.remove();
            } else {
              Contains.declarations.delete(child.prop);
            }
          }
        }
      });
    } else {
      return;
    }

    const last = lastDecl(this.#container!); //!
    const temp = last?.cloneAfter();

    for (const [property, vals] of Contains.declarations) {
      temp?.before({
        prop: property,
        value: vals.value,
      });
    }

    temp?.remove();
  }

  end() {
    this.#container = undefined;
    Contains.declarations.clear();
  }

  reset() {
    STORE.clear();
    this.#pairs.reset();
    this.#singles.reset();
  }
}
