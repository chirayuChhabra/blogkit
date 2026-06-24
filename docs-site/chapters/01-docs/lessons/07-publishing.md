# Publishing

## Global Theming
You can define global themes by passing options in the YAML frontmatter of your `chapter.md` or `lesson.md` files. 
Lessons automatically inherit their parent chapter's options!

```yaml
---
title: "My Lesson"
theme: "auto"
palette: "ink"
ui: "standard"
---
```

> [!note]
> Easter egg: In the generated UI settings panel, readers can **double-click** a palette color to unlock special evolved color palettes!

## Production Checks (Strict Mode)
Strict mode is **enabled by default**. It actively catches:

- Missing lesson titles or slugs
- Completely empty lessons
- Simulation, animation, and media blocks that are shorter than 240px
- Image blocks without `alt` text (for accessibility)
- `animation`-only simulations without captions (since readers cannot interact with them, they must be explained)

If any of these conditions are met, the build will throw an error and abort, preventing a broken lesson from reaching production.

### Disabling Strict Mode
You can turn it off during drafting by setting `strict: false` in your lesson frontmatter:

```yaml
---
title: "Draft"
strict: false
---
```

## Deploying
Run the build script to compile the site to the `out/` directory:

```bash
bunx mr-md build chapters/01-docs/chapter.md
```
