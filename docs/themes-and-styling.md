# Themes and Styling

Generated pages include a built-in theme and palette selector. Readers can customize the look of the lesson in the settings panel (which persists their preferences in `localStorage`).

## Global Configuration

In your `lesson()` options, you can define the default starting appearance:

```ts
export default lesson("My Lesson", {
  theme: "auto",
  palette: "ink",
  preset: { layout: "lab", tone: "scholarly" },
  font: "Inter, sans-serif"
})
```

### Supported Options:

- **`theme`**: `"auto"` (respects OS preference), `"light"`, or `"dark"`.
- **`palette`**: `"ink"` (default grayscale/blue), `"field"` (green accent), or `"ember"` (orange/red accent).
- **`font`**: Override the default typography. You can provide any valid CSS font stack (e.g., `"Comic Sans MS", "Chalkboard SE", sans-serif`).

## Dark Mode in Content

If you are writing custom CSS or building simulations, you can hook into the current theme seamlessly. Blogkit sets the `data-theme` attribute on the `<html>` root element, but it is highly recommended to rely on standard media queries inside simulations:

```css
/* Standard color */
body { background: white; color: black; }

/* Dark mode override */
@media (prefers-color-scheme: dark) {
  body { background: #0a0a0a; color: white; }
}
```
