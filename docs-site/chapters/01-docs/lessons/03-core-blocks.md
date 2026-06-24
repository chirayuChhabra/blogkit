# Core Blocks

While standard markdown is supported effortlessly, you will often want to structure your page with specific semantic layouts. Mr Markdown provides targeted features to do exactly this.

## Headings and Navigation

To create a structural heading on your page that *also* automatically generates a link in the sidebar navigation, use standard markdown headings (`#` or `##`).

## Callouts & Notifications

Callouts are stylized, colored boxes used to draw attention to specific information. You can create them using standard GitHub-Flavored Markdown blockquote syntax:

```markdown
> [!important]
> This is a critical alert. Use it for things like safety warnings or breaking changes.

> [!warning]
> Use this to warn users about potential pitfalls or deprecated APIs.
```

*Live Examples:*

> [!important]
> This is a critical alert. Use it for things like safety warnings or breaking changes.

> [!warning]
> Use this to warn users about potential pitfalls or deprecated APIs.

> [!tip]
> This is a helpful tip! Great for performance optimizations or best practices.

> [!note]
> Use this for side-notes or additional background context that shouldn't distract from the main lesson.

> [!note]
> The second argument is a short label used specifically for the sidebar navigation. If omitted, the full title is used.

## Responsive Columns

To present information side-by-side (like putting an explanation next to code), use the `<columns>` tag.

On desktop, the items are placed horizontally. On mobile screens, Mr Markdown automatically stacks them vertically!

```html
<columns>
  <column markdown="### Explanation\n\nThis code on the right demonstrates how to use the columns tag." />
  <column code="const x = 10;\nconsole.log(x);" />
</columns>
```

*Live Example:*

<columns>
<column markdown="### Explanation\n\nThis code on the right demonstrates how to use the columns method." />
<column code="const x = 10;\nconsole.log(x);" />
</columns>

Each item can take a specific key:
- `markdown`: A raw markdown string.
- `src`: A path to a markdown file.
- `code`: Raw code to display.
- `latex`: A raw KaTeX math string.

## Displaying Code Blocks

To display a beautiful, syntax-highlighted code snippet, use standard markdown fenced code blocks:

```bash
# From a string:
npm install mr-md
```

## Spacers & Dividers

Sometimes you need a little breathing room between blocks. Use the `---` and `<br/>` tags:

```html
<!-- Add a horizontal rule -->
---

<!-- Add blank vertical space (size is a multiplier where 1 = 24px) -->
<space size="2" />
```

*Live Example:*

---

<space size="2" />

> [!note]
> You can also type `---` inside your standard `.md` files to achieve the exact same horizontal divider!

---

**Next up:** Let's look at embedding rich media (images and video) and rendering beautiful LaTeX math formulas.
