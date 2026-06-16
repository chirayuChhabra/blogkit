## Production Checks (Strict Mode)
Strict mode is **enabled by default**. It actively catches:

- Missing lesson titles or slugs
- Completely empty lessons
- Simulation, animation, and media blocks that are shorter than 240px
- Image blocks without `alt` text (for accessibility)
- `observe`-only simulations without captions (since readers cannot interact with them, they must be explained)

If any of these conditions are met, the build will throw an error and abort, preventing a broken lesson from reaching production.

### Disabling Strict Mode
You can turn it off during drafting by setting `strict: false` in your lesson options:

```ts
export const myLesson = lesson("Draft", { strict: false }, ctx => {
  // Strict mode disabled
});
```

## Deploying
Run the build script to compile the site to the `out/` directory:

```bash
bun run build
```
