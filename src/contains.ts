import type { Container, Declaration, Helpers } from "postcss";

type Duplication = "merge" | "replace";

type Variant = "pair" | "single";

type Status = "add" | "discard"

type Bucket = {
  variant: Variant;
  value: string;
  overrides?: boolean;
  declarations: Map<string, string>;
};

type Pile = {
  variant: Variant;
  overrides?: boolean;
  declarations: Map<string, string>;
};

type Meet = {
  property: string;
  value?: string;
  variant: Variant;
};


class Pairs {
  #duplication: Duplication = "merge";
  properties: string[] = [];
  buckets: Bucket[] = [];
  // holds the indices of matched properties temply
  static indices: number[] = [];
  static duplicatedIndex: number | null;

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket): Status {
    const isDuplicated = this.isDuplicated(property, bucket);

    if (isDuplicated) {
      this.resolve(bucket);
      return "discard";
    }

    this.properties.push(property);
    this.buckets.push(bucket);
    return "add";
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
    const oldBucket = this.buckets[Pairs.duplicatedIndex!];  //!
    const oldDecls = oldBucket?.declarations;
    const newDecls = bucket.declarations;

    if (oldDecls) {
      if (this.#duplication === "merge") {
        const mergedDecls = new Map([...oldDecls, ...newDecls]);
        oldBucket.declarations = mergedDecls;
        oldBucket.overrides = oldBucket.overrides || bucket.overrides;
      } else {
        oldBucket.declarations = newDecls;
        oldBucket.overrides = bucket.overrides;
      }
    }

    Pairs.indices = [];
    Pairs.duplicatedIndex = null;
  }
}


class Singles {
  #duplication: Duplication = "merge";
  #piles = new Map<string, Pile>();
  static duplicatedProperty: string | null;

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  add(property: string, bucket: Bucket): Status {
    const isDuplicated = this.isDuplicated(property);

    if (isDuplicated) {
      this.resolve(bucket);
      return "discard";
    }

    this.#piles.set(property, bucket);
    return "add";
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
      const oldBucket = this.#piles.get(property);
      const oldDecls = this.#piles.get(property)?.declarations;
      const newDecls = bucket.declarations;

      if (oldDecls) {
        if (this.#duplication === "merge") {
          const mergedDecls = new Map([...oldDecls, ...newDecls]);
          oldBucket!.declarations = mergedDecls; //!
          oldBucket!.overrides = oldBucket!.overrides || bucket.overrides
        } else {
          oldBucket!.declarations = bucket.declarations;
          oldBucket!.overrides = bucket.overrides;
        }
      }
    }

    Singles.duplicatedProperty = null;
  }
}


export class Stash {
  #duplication: Duplication = "merge";
  #container!: Container | undefined;

  #store = new Set<Map<string, Bucket>>();           // store @contains condition with their styles by `Once` method
  #singles = new Singles(this.#duplication);
  #pairs = new Pairs(this.#duplication);

  static meets = new Set<Meet>();                    // holds matched @contains temporarily
  static declarations = new Map<string, string>();   // holds all containers' decls temporarily

  constructor(duplication: Duplication) {
    this.#duplication = duplication;
  }

  // 1) collecting @contains
  add(property: string, bucket: Bucket) {
    let status: Status;

    if (bucket.variant === "pair") {
      status = this.#pairs.add(property, bucket);
    } else {
      status = this.#singles.add(property, bucket);
    }

    if (status === "add") {
      const map = new Map([[property, bucket]]);
      this.#store.add(map);
    }
  }

  // 2) working with container & nodes
  start(container: Container) {
    this.#container = container;
  }

  process() {
    const satisfied = this.satisfy();

    if (satisfied) {
      this.#container?.each((child) => {});
    } else {
      return;
    }
  }

  end() {
    this.#container = undefined;
  }

  satisfy() {
    let satisfied: boolean | undefined;

    // #container can't be `undefined` here, so `!` is used
    this.#container!.each((child, index) => {
      if (child.type === "decl") {
        for (const [property, bucket] of this.#store) {
          if (bucket.variant === "pair") {
            if (child.prop === property && child.value === bucket.value) {
              satisfied = true;
              Stash.meets.add({
                property,
                value: bucket.value,
                variant: bucket.variant,
              });
              this.#pairs.set(property, bucket);
              bucket.declarations.forEach((value, property) => {
                Stash.declarations.set(property, value);
              });
            } else {
              return;
            }
          } else if (bucket.variant === "single") {
            if (child.prop === property) {
              satisfied = true;
              Stash.meets.add({ property, variant: bucket.variant });
              this.#singles.set(property, bucket);
              bucket.declarations.forEach((value, property) => {
                Stash.declarations.set(property, value);
              });
            } else {
              return;
            }
          }
        }
      } else {
        return;
      }
    });

    return satisfied;
  }

  resolveConflicts() {}
}

// const stash = new Stash("merge")

// console.log(stash)
// stash.add()
