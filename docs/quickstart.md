# Quick Start

Blogkit is an opinionated TypeScript SDK for building interactive, single-file learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Installation

Ensure you have a Node.js or Bun environment set up.

## Your First Lesson

Create a file named `charge.lesson.ts` (or similar) and import `lesson` from `blogkit`.

```ts
import { lesson } from "blogkit";

export default lesson("Charge is a Mystery", {
  contentBase: "./content", // Where your markdown files live
  outDir: "./out",          // Where the compiled HTML will go
  theme: "auto",
  palette: "ink",
  preset: { layout: "lab", tone: "scholarly" },
  font: "Inter, sans-serif" // Optional custom font
})
  .description("A guided lesson about electric charge.")
  .tags("physics", "electromagnetism")
  .author("Chirayu")
  
  // Use core blocks to build your page sequentially:
  .chapter("intro.md")
  .lab("../charge-sim.js", { label: "Electric field explorer" })
  
  .columns([
    { markdown: "Force weakens with distance." },
    { latex: "F = k\\frac{q_1q_2}{r^2}" },
  ])
  
  .youtube("https://youtu.be/dQw4w9WgXcQ", { label: "Reference clip" })
  .quiz("questions.json")
  .build();
```

## Compiling

Run your lesson file with `ts-node`, `bun`, or `tsx` to compile it. This generates a single, self-contained HTML file in your `outDir`.

```bash
bun example/charge.lesson.ts
# or
npx ts-node example/charge.lesson.ts
```

Next, read about the [Core Blocks](./core-blocks.md) to see everything you can add to a lesson.
