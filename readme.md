# postcss-contains

**postcss-contains** enables you to apply styles to selectors based on specific property or declaration (property-value pair).

The `@contains` at-rule targets selectors when they _contain_:

  - A specific property (e.g., position or margin)
  - A specific declaration (property-value pair, e.g., display: grid)


## Installation

```sh
npm install postcss-contains --save-dev
```


## Usage

```js
// postcss.config.js
import postcssContains from "postcss-contains"

export default {
  plugins: [ postcssContains ]
}
```

```css
@contains (position) {
  isolation: isolate;
}

@contains (display: grid) {
  grid-auto-flow: column;
}

header {
  position: fixed;
}

div {
  position: relative;
  display: grid;
}
```

Output:

```css
header {
  position: fixed;
  isolation: isolate;
}

div {
  display: grid;
  grid-auto-flow: column;
  isolation: isolate;
}
```

## Edge Cases

### Conflicts

- If there's a style conflict between a `@contains` and a selector, the selector's styles prevails by default. To change this, use the `overrides` keyword.

```css
@contains overrides (display: inline-block) {
  padding: 1rem;
  color: red;
}

div {
  display: inline-block;
  color: blue;
}
```

Output:

```css
div {
  display: inline-block;
  padding: 1rem;
  color: red;
}
```

### Duplications

- If two `@contains` target the same property/declaration, their styles will be merged. However, you can change this behavior by setting `duplication` option to `"replace"`; in this case, the order of appearance will determine which style should be applied: the latter contains taking precedence over the former.

> Note: The `overrides` only affects the conflicts between @contains and selectors, not between duplicated @contains rules.

> Note: If one of two (or many) @contains defined with `overrides`, their styles will be merged with `overrides` too.

See [options](#options) for more.


### Specificity

- Property-value matches take precedence over property-only matches. In this example `display: iniline-block` is more specific than `display`, so it wins the conflict over `color`.

```css
@contains (display) {
  color: red;
}

@contains (display: inline-block) {
  color: blue;
}

div {
  display: inline-block;
}
```

Output:

```css
div {
  display: inline-block;
  color: blue;
}
```

A wrap up example:

```css
/* a */
@contains overrides (padding) {
  margin: 0;
  color: black;
  border: none;
}

/* b */
@contains (padding: 1rem) {
  border: 2px dashed;
  color: white;
}

div {
  margin: 5px;
  padding: 1rem;
  border: 1px solid;
}
```

Output:

```css
div {
  margin: 0;      /* "div" and "a" both has margin but since "a" defined with `overrides` it won the conflict */
  color: white;   /* "b"'s condition is a property-value pair and more specific than "a" so won the 'color conflict' */
  border: 1px solid;
  /* "b" is pair so wins 'border conflict' over "a", but the `div` itself take precedence over "b".
     "b" would defeat the "div" if it had the `overrides` keyword */
}
```

## Options

#### `duplication`

type: `"merge" | "replace"`

default: `"merge"`


#### `duplication: "merge"`

```css
@contains (padding) {
  margin: 1rem;
}

@contains (padding) {
  border: 0;
}

div {
  padding: 0.5rem 1rem;
}
```

Output:

```css
div {
  padding: 0.5rem 1rem;
  margin: 1rem;  /* there wouldn't be any margin if duplication was "replace" */
  border: 0;
}
```

#### `duplication: "replace"`

```css
@contains overrides (display: grid) {
  /* this looses the conflict to the below contains despite including `overrides`; as mentioned, `overrides` only comes to play when there is a conflict between @contains and selectors styles, not when two `@contains` are duplicated. */
  padding: 1rem;
  color: red;
}

@contains (display: grid) {
  margin: 1rem;
  color: blue;
}

div {
  display: grid;
}
```

Output:

```css
div {
  display: grid;
  margin: 1rem;
  color: blue;
}
```

**Note:** This option only matters when **two @contains of the same kind are duplicated**. In the following example, "b" and "c" are considered as a duplication but "a" and "b" are not.

```css
/* a */
@contains (color) {}

/* b */
@contains (color: red) {}

/* c */
@contains (color: red) {}
```
