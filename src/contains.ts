import type { Container, AtRule, Result } from "postcss";
import { checkIssues, extract, getParams, lastDecl } from "./utils.js";

type Duplication = "merge" | "replace";

type Variant = "single" | "pair";

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

type Pile = Omit<Bucket, "value">;

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
  #properties: string[] = [];
  #buckets: Bucket[] = [];
  static #indices: number[] = []; // holds the indices of matched properties temply
  static #duplicatedIndex: number | null; // holde duplicated index temply

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket) {
    const isDuplicated = this.#isDuplicated(property, bucket);

    if (isDuplicated) {
      this.#resolve(bucket);
      return;
    }

    this.#properties.push(property);
    this.#buckets.push(bucket);
    STORE.add({ property, bucket });
  }

  #isDuplicated(property: string, bucket: Bucket) {
    this.#properties.forEach((p, i) => {
      if (p === property) {
        Pairs.#indices.push(i);
      }
    });

    for (const index of Pairs.#indices) {
      if (this.#buckets[index]?.value === bucket.value) {
        Pairs.#duplicatedIndex = index;
        return true;
      }
    }

    return false;
  }

  #resolve(bucket: Bucket) {
    let oldBucket = this.#buckets[Pairs.#duplicatedIndex!]; //!
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

    Pairs.#indices = [];
    Pairs.#duplicatedIndex = null;
  }

  reset() {
    this.#properties = [];
    this.#buckets = [];
  }
}

class Singles {
  #duplication: Duplication = "merge";
  #piles = new Map<string, Pile>(); //+ Wrrr: "V" is `Pile` but we are sending `Bucket`
  static #duplicatedProperty: string | null;

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket) {
    const isDuplicated = this.#isDuplicated(property);

    if (isDuplicated) {
      this.#resolve(bucket);
      return;
    }

    this.#piles.set(property, bucket);
    STORE.add({ property, bucket });
  }

  #isDuplicated(property: string) {
    if (this.#piles.has(property)) {
      Singles.#duplicatedProperty = property;
      return true;
    } else {
      return false;
    }
  }

  #resolve(bucket: Bucket) {
    const property = Singles.#duplicatedProperty;

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

    Singles.#duplicatedProperty = null;
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
  #declarations = new Map<string, Vals>(); // holds all containers' decls temporarily

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
    this.#singles = new Singles(this.#duplication);
    this.#pairs = new Pairs(this.#duplication);
  }

  // 1) collecting all @contains: queries and their declarations
  collect(atRule: AtRule, result: Result) {
    const params = getParams(atRule.params);
    const overrides = atRule.params.startsWith("overrides");

    checkIssues(atRule, result);

    if (params.includes(":")) {
      const variant: Variant = "pair";
      const { property, value } = extract(params, variant);

      if (!property || !value) {
        throw atRule.error(
          `Something went wrong on \t ${atRule.toString()} \n\t >>> property: ${property} - value: ${value}`,
        );
      }

      const declarations = new Map<string, string>();

      for (const node of atRule.nodes!) {
        //!
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
      const variant: Variant = "single";
      const { property } = extract(params, variant);

      if (!property) {
        throw atRule.error(
          `Something went wrong on \t ${atRule.toString()} \n\t >>> property: ${property}`,
        );
      }

      const declarations = new Map<string, string>();

      for (const node of atRule.nodes!) {
        //!
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
  }

  add(property: string, bucket: Bucket) {
    if (bucket.variant === "pair") {
      this.#pairs.add(property, bucket);
    } else if (bucket.variant === "single") {
      this.#singles.add(property, bucket);
    }
  }

  // 2) check each rule to find matches property/declaration
  #find() {
    let found: boolean | undefined;

    this.#container!.each((child) => {
      if (child.type === "decl") {
        for (const pack of STORE) {
          const property = pack.property;
          const bucket = pack.bucket;

          if (bucket.variant === "pair") {
            if (child.prop === property && child.value === bucket.value) {
              this.#setDecls(bucket);
              found = true;
            }
          } else if (bucket.variant === "single") {
            if (child.prop === property) {
              this.#setDecls(bucket);
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

  #setDecls(bucket: Bucket) {
    let variant = bucket.variant;
    let overrides = bucket.overrides;
    let declarations = bucket.declarations;

    for (const [property, value] of declarations) {
      /**
       * if a property already exists:
       *  - the "pair" one should overwrite the "single" one
       *  - the later "pair"/"single" should overwrite the previous "pair"/"single"
       */
      if (this.#declarations.has(property)) {
        const existingVariant = this.#declarations.get(property)?.variant;
        if (existingVariant === "pair" && variant === "single") {
          continue;
        } else {
          const val = { value, overrides, variant };
          this.#declarations.set(property, val);
        }
      } else {
        const val = { value, overrides, variant };
        this.#declarations.set(property, val);
      }
    }
  }

  // 3) processe and mutate nodes
  start(container: Container) {
    this.#container = container;
  }

  process() {
    const found = this.#find();

    if (found) {
      this.#container?.each((child) => {
        if (child.type === "decl") {
          if (this.#declarations.has(child.prop)) {
            const vals = this.#declarations.get(child.prop);
            if (vals?.overrides) {
              child.remove();
            } else {
              this.#declarations.delete(child.prop);
            }
          }
        }
      });
    } else {
      return;
    }

    const last = lastDecl(this.#container!); //!
    const temp = last?.cloneAfter();

    for (const [property, vals] of this.#declarations) {
      temp?.before({
        prop: property,
        value: vals.value,
      });
    }

    temp?.remove();
  }

  end() {
    this.#container = undefined;
    this.#declarations.clear();
  }

  reset() {
    STORE.clear();
    this.#pairs.reset();
    this.#singles.reset();
  }
}
