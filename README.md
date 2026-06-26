# Mr Markdown

Mr Markdown is an opinionated Markdown framework for building interactive learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Documentation

The documentation has been consolidated into a modern guide:

1. [Showcase](./docs/01-showcase.md) - See what Mr Markdown can do.
2. [Quickstart](./docs/02-quickstart.md) - Learn how to get started and use the CLI.
3. [Modules & Features](./docs/03-modules.md) - Learn how to write rich markdown content.
4. [Creating Quizzes](./docs/04-creating-quizzes.md) - Learn how to define interactive quizzes via Markdown.
5. [Creating Simulations](./docs/05-creating-simulations.md) - Learn how to build and embed sandboxed JS simulations.

## Quick Start (CLI)

The easiest way to use Mr Markdown is to run the dev server on a Markdown file.

First, create a file with some content (or use your own existing `lesson.md` file):

```bash
echo "# Hello World" > lesson.md
```

Then, start the development server:

```bash
bunx mr-md dev lesson.md
```

Or, for a full chapter, put your `.md` files in a folder, `cd` into it, and run:
```bash
bunx mr-md dev .
```

