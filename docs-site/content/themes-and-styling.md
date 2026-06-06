# Themes and Styling

Generated pages include a built-in theme and palette selector. Readers can customize the look of the lesson in the settings panel (which persists their preferences in `localStorage`).

## Global Configuration

In your `lesson()` options, you can define the default starting appearance:

```ts
export const myLesson = lesson("My Lesson", {
  contentBase: import.meta.dir,
  theme: "auto",
  palette: "ink",
  preset: { layout: "lab", tone: "scholarly" },
  font: "Inter, sans-serif"
}, ctx => {
  // Add content here
});
```

### Supported Options:

- **`theme`**: `"auto"` (respects OS preference), `"light"`, or `"dark"`.
- **`palette`**: `"ink"` (default grayscale/blue), `"field"` (green accent), or `"ember"` (orange/red accent).
- **`font`**: Override the default typography. You can provide any valid CSS font stack (e.g., `"Comic Sans MS", "Chalkboard SE", sans-serif`).

## Dark Mode in Content

If you are writing custom CSS, you can hook into the current theme seamlessly. Mr Markdown sets the `data-theme` attribute on the `<html>` root element. It is highly recommended to use CSS variables if possible, but if you need to hardcode colors, be sure to respect the user's manual theme override:

```css
/* Fallback to dark mode ONLY if the user hasn't forced light mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) body {
    background: #0a0a0a;
    color: white;
  }
}

/* Force dark mode if the user manually overrides the theme */
:root[data-theme="dark"] body {
  background: #0a0a0a;
  color: white;
}
```
