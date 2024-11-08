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

---

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
div {
  display: initial;
  color: plum;
}
```

---


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

Output:

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

---

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
  margin: 8px;  /* second @contains has no `overrides` so the margin remain intact */
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
