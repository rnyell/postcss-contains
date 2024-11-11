## Warning & Errors

### Warns

- Empty @contains (contains with no styles)

```css
@contains (margin) {
  /* empty */
}
```

- Using new lines before curly bracket

```css
@contains overrides 
  (margin) {
  /* styles */
}
```

### Errors

- Nesting rules or at-rules inside style block

```css
@contains (display: grid) {
  place-items: center;

  &:hover {
    scale: 1.2;
  }
}
```

- @contains without styles (curly brackets)

```css
@contains (margin);
```

- No property or declaration passed to @contains

```css
@Contains () {
  /* styles */
}
```

- Misusing properties e.g. new lines on the parenthesis

```css
@contains (dis
  play: block) {
  /* styles */
}

@contains (mar gin: 1rem) {
  /* styles */
}
```

- Using semicolon in parenthesis

```css
@contains (margin;) {
  /* styles */
}

@contains (inset: auto;) {
  /* styles */
}
```

## Some More Examples

Conflicts between two contains and `div` element

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
  padding: 1rem;
  margin: 0;
  /* "div" and "a" both has margin but since "a" defined with `overrides` it won the conflict */
  color: white;
  /* "b"'s condition is a property-value pair and more specific than "a" so won the 'color conflict' */
  border: 1px solid;
  /* "b" is pair so wins 'border conflict' over "a", but the `div` itself take precedence over "b". "b" would defeat the "div" if it had the `overrides` keyword */
}
```

Contains can also modify the targeted declaration; in this example the `span` contains `display: block` so it gets targeted by the second contains, however, the first one overrides the `block` value to `initial`.

```css
@contains overrides (color) {
  display: initial;
}

@contains (display: block) {
  color: inherit;
}

span {
  diplay: block;
  color: plum;
}
```

Output:

```css
span {
  display: initial;
  color: plum;
}
```

A messy one!

```css
@contains (padding: 1rem) {
  display: grid;
  color: white;
  border: 2px dashed;
}

@contains overrides (padding) {
  margin: 0;
  overflow: scroll;
  will-change: transform;
  border: none;
}

@contains overrides (display: flex) {
  box-sizing: content-box;
  overflow: hidden;
  gap: 1rem;
}

@contains (display) {
  position: relative;
  z-index: 0;
}

@contains overrides (color) {
  display: block;
  color: unset;
  border: 4px solid;
}

div {
  margin: 5px;
  padding: 1rem;
  display: flex;
  gap: 0;
  color: limegreen;
  border: 1px solid;
}
```

Output: (`duplication: merge`)

```css
div {
  padding: 1rem;
  display: flex;
  color: limegreen;
  border: 1px solid;
  margin: 0;
  will-change: transform;
  box-sizing: content-box;
  overflow: hidden;
  gap: 1rem;
  position: relative;
  z-index: 0;
}
```

Exploring the effect of different options on the output

```css
@contains (display: flex) {
  margin: 1rem;
  color: pink;
}

@contains (display: flex) {
  color: red;
  border: 0;
}

div {
  display: flex;
}
```

Output: (`duplication: replace`)

```css
div {
  display: flex;
  color: red;
  border: 0;
}
```

---

```css
@contains overrides (display: grid) {
  padding: 1rem;
  color: red;
  margin: 0;
}

@contains (display: grid) {
  margin: 1rem;
  color: blue;
}

div {
  margin: 8px;
  display: grid;
}
```

Output: (`duplication: replace`)

```css
div {
  margin: 8px; /* second @contains has no `overrides` so div's margin remained intact */
  display: grid;
  color: blue;
}
```

Output: (`duplication: merge`)

```css
/*
merged contains looks like this:

@contains overrides (display: grid) {
  padding: 1rem;
  margin: 1rem;
  color: blue;
}
*/

div {
  display: grid;
  padding: 1rem;
  margin: 1rem;
  color: blue;
}
```
