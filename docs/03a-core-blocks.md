
While the `ctx.add()` router handles standard markdown files effortlessly, you will often want to structure your page with specific semantic layouts. Mr Markdown provides targeted builder methods on the `ctx` object to do exactly this.

## Headings and Navigation

To create a structural heading on your page that *also* automatically generates a link in the sidebar navigation, use `ctx.heading()` or `ctx.section()`.

```ts
export const myLesson = lesson("My Lesson", { contentBase: import.meta.dir }, ctx => {
  // Creates an <h1> and a primary sidebar entry:
  ctx.heading("Introduction", "Intro");
  
  // You can intersperse markdown:
  ctx.add("content/intro.md");
  
  // Creates an <h2> and a nested sidebar entry:
  ctx.section("The Core Principles", "Principles");
});
```