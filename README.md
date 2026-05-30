# Mr Markdown

Mr Markdown is an opinionated TypeScript SDK for building interactive, single-file learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Documentation

The documentation has been split into dedicated guides. Start with the Quick Start, and then explore the core features:

1. [Quick Start](./docs/quickstart.md) - Learn how to build your first lesson.
2. [Core Blocks](./docs/core-blocks.md) - An overview of the API and layout components (markdown, math, media, callouts).
3. [Simulations & Interactivity](./docs/simulations.md) - The definitive guide for building and integrating sandboxed JavaScript simulations, including zero-config companion files.
4. [Themes and Styling](./docs/themes-and-styling.md) - Learn how to customize fonts, colors, and hook into Dark Mode.
5. [Quizzes](./docs/quizzes.md) - Learn the JSON format for injecting interactive quizzes.
6. [Production Checks](./docs/production-checks.md) - Understand Mr Markdown's strict mode and quality enforcement.

## Example

To see a full example in action, compile the included `charge.lesson.ts`:

```bash
npx ts-node example/charge.lesson.ts
# or 
bun example/charge.lesson.ts
```
