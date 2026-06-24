# Setup

## Prerequisites

Ensure you have a Node.js or Bun environment set up.

## Getting Started

Mr Markdown makes it incredibly easy to start. You don't need any complex folder structures! Just create a markdown file and build it.

```bash
bun add mr-md
```

Create a `lesson.md` file:

```markdown
# My First Lesson
This is my content.
```

And build it!

```bash
bunx mr-md build lesson.md
```

### Creating Chapters

If you want to group multiple lessons into a chapter, create a markdown file and add `chapter: true` to its frontmatter. It will act as a table of contents.

```yaml
---
chapter: true
title: "My Course"
---
- [My First Lesson](lesson.md)
```

Build the chapter:

```bash
bunx mr-md build course.md
```

## Running the Development Server

To see your lesson live in the browser, run the development server:

```bash
bunx mr-md dev course.md
```

The dev server watches your files for changes, re-runs the build script, and automatically refreshes your browser.
