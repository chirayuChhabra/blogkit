## Callouts & Notifications

Callouts are stylized, colored boxes used to draw attention to specific information.

You can supply raw markdown strings directly to these methods instead of a file path!

```ts
export const myLesson = lesson("Safety Lesson", { contentBase: import.meta.dir }, ctx => {
  
  ctx.important("This is a critical alert. Use it for things like safety warnings or breaking changes.");
  
  ctx.warning("Use this to warn users about potential pitfalls or deprecated APIs.");
  
  ctx.tip("This is a helpful tip! Great for performance optimizations or best practices.");
  
  ctx.note("Use this for side-notes or additional background context that shouldn't distract from the main lesson.");
  
});
```

## Responsive Columns

To present information side-by-side (like putting an explanation next to code), use `ctx.columns()`.

On desktop, the items are placed horizontally. On mobile screens, Mr Markdown automatically stacks them vertically!

```ts
export const myLesson = lesson("Layouts", { contentBase: import.meta.dir }, ctx => {
  
  ctx.columns([
    {
      markdown: "### Explanation\n\nThis code on the right demonstrates how to use the `columns` method."
    },
    {
      code: "const x = 10;\nconsole.log(x);",
      lang: "javascript",
      label: "example.js"
    }
  ]);
  
});
```

Each item in the array can take a specific key:
- `markdown`: A raw markdown string.
- `src`: A path to a markdown file.
- `code`: Raw code to display.
- `latex`: A raw KaTeX math string.

## Displaying Code Blocks

To display a beautiful, syntax-highlighted code snippet:

```ts
// From a string:
ctx.code("npm install mr-md", "bash");

// Or from a file:
ctx.code("src/server.ts", "typescript", "server.ts");
```

## Spacers & Dividers

Sometimes you need a little breathing room between blocks.

```ts
// Add a beautifully styled horizontal divider line:
ctx.divider();

// Add an invisible vertical spacer. 
// The number acts as a multiplier (1 = 24px of height)
ctx.space(2); // Adds 48px of blank space
```

> **Note:** You can also type `---` inside your standard `.md` files to achieve the exact same horizontal divider!

---

**Next up:** Let's look at embedding rich media (images and video) and rendering beautiful LaTeX math formulas.
