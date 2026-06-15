# Quick Start

Mr Markdown is an opinionated TypeScript SDK for building interactive, single-file learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Getting Started

The fastest way to start is to use our built-in CLI to scaffold a new project. Ensure you have a Node.js or Bun environment set up.

```bash
# In an empty directory, initialize the project structure
bunx mr-md init
```

This command will automatically set up the recommended folder structure, including a sample chapter and lesson.

## Your First Lesson

Navigate to your newly scaffolded chapter and open the lesson file (e.g. `lessons/01-lesson/lesson.ts`). It will look something like this:

```ts
import { lesson } from "mr-md";

export const myLesson = lesson("Hello World", { contentBase: import.meta.dir }, ctx => {
  ctx.description("My very first lesson.");
  
  // Use the smart ctx.add() router to quickly sequence your files:
  ctx.add("content/intro.md");
  
  // Or use specific layout blocks for advanced needs:
  ctx.latex("e^{i\\pi} + 1 = 0");
});
```

## Preview Your Changes

To see your lesson live in the browser, run the development server from the root of your project:

```bash
bun run dev
```

The dev server watches your files for changes, re-runs the build script, and automatically refreshes your browser.

Next, read about the [Command Line Interface (CLI)](./cli.md) to learn how to generate new chapters and lessons, or explore the [Core Blocks](./core-blocks.md) to see everything you can add to a lesson.
