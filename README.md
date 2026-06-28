# Mr Markdown

Mr Markdown is an opinionated Markdown framework for building interactive learning pages. It is designed for lessons that mix prose, LaTeX, simulations, media, video, and quizzes without making every author build layout and interaction chrome from scratch.

## Documentation

The documentation has been consolidated into a modern guide:

1. [Showcase](./mr-markdown-documentation/01-showcase.md) - See what Mr Markdown can do.
2. [Quickstart](./mr-markdown-documentation/02-quickstart.md) - Learn how to get started and use the CLI.
3. [Modules & Features](./mr-markdown-documentation/03-modules.md) - Learn how to write rich markdown content.
4. [Creating Quizzes](./mr-markdown-documentation/04-creating-quizzes.md) - Learn how to define interactive quizzes via Markdown.
5. [Creating Simulations](./mr-markdown-documentation/05-creating-simulations.md) - Learn how to build and embed sandboxed JS simulations.

## Quick Start (CLI)

The easiest way to get started is by using the CLI on a single file.

**1. Create a lesson file**
```bash
echo "# Hello World" > lesson.md
```

**2. Start the development server**
```bash
bunx mr-md dev lesson.md
```

**3. Build for production**
```bash
bunx mr-md build lesson.md
```

> **Tip:** You can also pass a directory instead of a single file to process an entire folder at once. For example, you can `cd` into a directory and run `bunx mr-md dev .` or `bunx mr-md build .`.

---

## License

Copyright (c) 2026 Chirayu Chhabra

Mr Markdown is provided under the PolyForm Noncommercial License 1.0.0.

**Free Use**
The software is free to use for personal, educational, and non-profit purposes. This includes student projects, hobbyist endeavors, academic teaching, and public research.

**Commercial Use**
Any commercial application, including use by for-profit entities, internal business operations, or paid freelance work, requires a separate commercial license.

For commercial licensing inquiries, please contact: contact@chirayuchhabra.com