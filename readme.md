# postcss-contains

**postcss-contains** enables you to apply styles to selectors based on specific property or declaration (property-value pair).

The `@contains` at-rule targets elements and selectors when they _contain_:

- A specific property (e.g. `position` or `margin`)
- A specific declaration (property-value pair, e.g. `display: grid`)


## Installation

```sh
npm install postcss-contains --save-dev
```


## Usage

```js
// postcss.config.js
import postcssContains from "postcss-contains"

export default {
  plugins: [postcssContains],
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

If there's a style conflict between a `@contains` and a selector, the selector's styles prevails by default. To modify this, use the `overrides` keyword.

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

When two `@contains` rules target the same property or declaration, their styles will merge by default.

You can change this behavior by setting `duplication` option to `"replace"`; in this case, the order of appearance will determine which style should be applied: the later contains takes precedence over the former.

```css
/* Both contains target selectors if they declared `display` property */
@contains (display) {
  margin: 1rem;
  gap: 1rem;
}

@contains (display) {
  padding: 1rem;
}

div {
  display: flex;
}
```

Output (`duplication: "merge"`):

```css
div {
  display: flex;
  margin: 1rem;
  gap: 1rem;
  padding: 1rem;
}
```

Output (`duplication: "replace"`):

```css
div {
  display: flex;
  padding: 1rem;
}
```

> Note: If one of two (or many) @contains defined with `overrides`, their styles will be merged with `overrides` too.

> Note: The `overrides` only affects the conflicts between @contains and selectors, not between duplicated @contains rules.

See [options](#options) for more.


### Specificity

"Property-value" matches considered with a specificity so they take precedence over "property-only" matches.

In the example below, `overflow: hidden` is more speccific than `display`, so `span` gets the `green` color; howwever the third contains also has a color declaration, since `display: block` and `overflow: hidden` have equal specificity —both are paird— then based on the order of appearance the color will be `blue`.

```css
@contains (display) {
  color: red;
}

@contains (overflow: hidden) {
  color: green;
}

@contains (display: block) {
  color: blue;
}

span {
  overflow: hidden;
  display: block;
}
```

Output:

```css
span {
  overflow: hidden;
  display: block;
  color: blue;
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
  margin: 1rem; /* there wouldn't be any margin if duplication was "replace" */
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

**Note:** This option only matters when **two @contains of the same type are duplicated**. In the following example, "b" and "c" are considered as a duplication but "a" and "b" are not.

```css
/* a */
@contains (color) {}

/* b */
@contains (color: red) {}

/* c */
@contains (color: red) {}
```

More examples are provided [here](./test/exmaples.md).
