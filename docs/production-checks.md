# Production Checks

Mr Markdown has an opinionated philosophy on quality. It enforces strict checks by default during the build process to ensure that your lesson is complete, accessible, and high-quality.

## Strict Mode

Strict mode is **enabled by default**. It actively catches:

- Missing lesson titles or slugs
- Completely empty lessons
- Broken file references (missing content files or missing media)
- Image blocks without `alt` text (for accessibility)
- `observe`-only simulations without captions (since readers cannot interact with them, they must be explained)

If any of these conditions are met, the build will throw an error and abort, preventing a broken lesson from reaching production.

## Disabling Strict Mode

While prototyping or writing rough drafts, you may wish to disable these checks to iterate quickly. You can do this by setting `strict: false` in the `lesson()` options:

```ts
lesson("Draft Lesson", { 
  strict: false 
})
```

*Warning: Never disable strict mode in production pipelines!*
