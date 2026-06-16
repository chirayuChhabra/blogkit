# Command Line Interface (CLI)

Mr Markdown includes a powerful built-in CLI to help you scaffold chapters, lessons, and quizzes, and to run a live-reloading development server.

## Initialization

If you're starting a new project from scratch, you can scaffold the recommended directory structure automatically:

```bash
bun add mr-md
bunx md init
```

This command will:
- Create a `chapters/01-chapter` folder with a sample `chapter.ts`
- Scaffold an initial `01-lesson` inside the chapter with an accompanying `lesson.ts`
- Create directories for `media`, `sims`, `quizzes`, and `content`

## Generators

To avoid manually creating folders and TypeScript files, you can use the `g` (generate) command. It automatically prefixes your folders with sequential numbers (like `01-`, `02-`) to maintain order.

### Generate a Chapter

```bash
bunx md g chapter my-new-chapter
```
*(You can also use `bunx md g ch my-new-chapter`)*

This creates a new chapter folder inside `chapters/`, setting up a `chapter.ts` file automatically formatted with the chapter name.

### Generate a Lesson

When inside a chapter folder (or at the root, if appropriately structured), you can generate a new lesson:

```bash
bunx md g lesson introduction
```
*(You can also use `bunx md g le introduction`)*

This creates a new lesson directory (e.g., `lessons/01-introduction`) complete with a `lesson.ts` and standard subfolders (`content`, `sims`, `media`, `quizzes`). The generator also automatically attempts to import and link the new lesson to the parent `chapter.ts`.

### Generate a Quiz

```bash
bunx md g quiz knowledge-check
```
*(You can also use `bunx md g qu knowledge-check`)*

This creates a new `quizzes/knowledge-check.json` filled with a sample multiple-choice question. It will also automatically inject `ctx.quiz("quizzes/knowledge-check.json")` into your current `lesson.ts`!

## Development Server

To preview your content locally with live-reload support:

```bash
bunx md dev chapters/01-first-chapter
# Or, to serve a specific chapter:
bunx md dev chapters/02-second-chapter
```

The dev server will:
- Watch your files for any changes.
- Automatically re-run the build script (`bun chapter.ts` or `bun lesson.ts`).
- Serve the generated HTML out of the `out/` directory.
- Automatically refresh your browser using websockets.
