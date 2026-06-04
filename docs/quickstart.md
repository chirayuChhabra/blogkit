# Quick Start

Mr Markdown is an opinionated TypeScript SDK for building interactive, single-file learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Installation

Ensure you have a Node.js or Bun environment set up.

## Your First Lesson

Create a file named `charge.lesson.ts` (or similar) and import `lesson` from `blogkit`.

```ts
import { lesson, chapter } from "mr-md";

export const myLesson = lesson("Charge is a Mystery", { contentBase: import.meta.dir }, ctx => {
  ctx.description("A guided lesson about electric charge.")
     .tags("physics", "electromagnetism")
     .author("Chirayu");
  
  // Use the smart ctx.add() router to quickly sequence your files:
  ctx.add("intro.md");
  ctx.add("../charge-sim.js", { label: "Electric field explorer" });
  
  // Or use specific layout blocks for advanced needs:
  ctx.columns([
    { markdown: "Force weakens with distance." },
    { latex: "F = k\\frac{q_1q_2}{r^2}" },
  ]);
  
  ctx.add("https://youtu.be/dQw4w9WgXcQ", { label: "Reference clip" });
  ctx.add("questions.json");
});

// Lessons inherit configuration (like outDir) from their parent Chapter!
export const physicsChapter = chapter("Physics 101", {
  outDir: "./out",          // Where the compiled HTML will go
  theme: "auto",
  palette: "ink",
  preset: { layout: "lab", tone: "scholarly" }
}, ctx => {
  ctx.lesson(myLesson);
});

if (import.meta.main) {
  physicsChapter.build();
}
```

## Compiling and Scaffolding

Mr Markdown includes a CLI designed to make managing chapters and lessons simple. You don't need to manually create these files.

```bash
# In an empty directory, initialize the project structure
bunx mr-md init

# Scaffold a new chapter
bunx mr-md g ch physics

# Go into the chapter and scaffold a lesson
cd chapters/01-physics
bunx mr-md g lesson intro

# Run the dev server to preview changes automatically!
bunx mr-md dev .
```

Next, read about the [Core Blocks](./core-blocks.md) to see everything you can add to a lesson.
