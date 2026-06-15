# Command Line Interface (CLI)

Mr Markdown includes a powerful built-in CLI to help you scaffold chapters, lessons, and quizzes, and to run a live-reloading development server.

## Initialization

If you're starting a new project from scratch, you can scaffold the recommended directory structure automatically:

```bash
bunx mr-md init
# or
npx mr-md init
```

This command will:
- Create a `chapters/01-chapter` folder with a sample `chapter.ts`
- Scaffold an initial `01-lesson` inside the chapter with an accompanying `lesson.ts`
- Create directories for `media`, `sims`, `quizzes`, and `content`

## Generators

To avoid manually creating folders and TypeScript files, you can use the `g` (generate) command. It automatically prefixes your folders with sequential numbers (like `01-`, `02-`) to maintain order.

### Generate a Chapter

```bash
bun run g chapter my-new-chapter
# or
npm run g chapter my-new-chapter
```
*(You can also use `bun run g ch my-new-chapter`)*

This creates a new chapter folder inside `chapters/`, setting up a `chapter.ts` file automatically formatted with the chapter name.

### Generate a Lesson

When inside a chapter folder (or at the root, if appropriately structured), you can generate a new lesson:

```bash
bun run g lesson introduction
```
*(You can also use `bun run g le introduction`)*

This creates a new lesson directory (e.g., `lessons/01-introduction`) complete with a `lesson.ts` and standard subfolders (`content`, `sims`, `media`, `quizzes`). The generator also automatically attempts to import and link the new lesson to the parent `chapter.ts`.

### Generate a Quiz

```bash
bun run g quiz knowledge-check
```
*(You can also use `bun run g qu knowledge-check`)*

This creates a new `quizzes/knowledge-check.json` filled with a sample multiple-choice question. It will also automatically inject `ctx.quiz("quizzes/knowledge-check.json")` into your current `lesson.ts`!

## Development Server

To preview your content locally with live-reload support:

```bash
bun run dev
# Or, to serve a specific chapter:
bun run dev chapters/01-chapter
```

The dev server will:
- Watch your files for any changes.
- Automatically re-run the build script (`bun chapter.ts` or `bun lesson.ts`).
- Serve the generated HTML out of the `out/` directory.
- Automatically refresh your browser using websockets.
