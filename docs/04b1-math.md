## Mathematical Formulas (LaTeX)

Mr Markdown has built-in, pre-configured support for KaTeX, a blazing-fast LaTeX math rendering engine.

### Inline Math in Markdown

Inside your standard markdown files (e.g. `content/intro.md`), you can seamlessly write math using `$` delimiters:

```markdown
The area of a circle is calculated using the formula $A = \pi r^2$.

To calculate the roots of a quadratic equation, use:
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Standalone LaTeX Blocks

If you want to render a large, standalone equation directly from your `lesson.ts` file without creating a separate markdown file, use the `ctx.latex()` method:

```ts
export const myLesson = lesson("Math", { contentBase: import.meta.dir }, ctx => {
  
  ctx.latex("e^{i\\pi} + 1 = 0");
  
});
```
