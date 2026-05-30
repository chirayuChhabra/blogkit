# Core Blocks

Mr Markdown provides a fluent API where you chain method calls on the `lesson()` builder to add blocks of content sequentially.

## The Smart `.add()` Router

For most use cases, you don't need to memorize specific method names. The universal `.add(src)` method automatically infers the correct block type based on the file extension or URL provided.

* **`.add("file.md")`** → Parses as standard Markdown.
* **`.add("sim.js")`** → Mounts an Interactive Lab.
* **`.add("questions.json")`** → Renders an Interactive Quiz.
* **`.add("video.mp4")`** → Embeds a local video.
* **`.add("image.png")`** → Embeds an image.
* **`.add("https://youtu.be/...")`** → Embeds a YouTube video.

```ts
lesson("My Lesson")
  .add("intro.md")
  .add("sim.js", { label: "Electric field explorer" })
  .add("questions.json")
```

If you need specific layout semantics (like a new major heading, callouts, or columns), you can use the targeted layout blocks below.

## Text & Markdown

* **`heading(src, title?)`**: Creates a primary section heading (H2) and a corresponding entry in the sidebar navigation.
* **`section(src, label?)`**: Creates a subsection heading (H3) and a nested entry in the sidebar navigation.
* **`content(src)` / `markdown(src)`**: Adds standard prose from a markdown file without creating a new sidebar entry.

## Callouts & Asides

Create standardized, stylized callout boxes to draw attention to important information:

* **`important(src)`**: Red/accented box for critical information.
* **`warning(src)`**: Orange/amber box for warnings.
* **`tip(src)`**: Green/teal box for helpful tips.
* **`note(src)`**: Blue/subtle box for additional context.
* **`callout(type, src)`**: A generic method to specify the callout type dynamically.

## Math & Layout

* **`latex(tex, opts?)`**: Renders a standalone KaTeX block. Math inside markdown files (using `$$` or `$`) is also automatically parsed and rendered by KaTeX.
* **`columns(items, opts?)`**: Creates responsive side-by-side columns. Each item in the array can specify `markdown`, a `src` file, or raw `latex`. On mobile devices, columns automatically stack vertically.

## Media

* **`image(src, opts)`**: Renders an image. *Note: In strict mode, you must provide `alt` text.*
* **`video(src, opts)`**: Renders an MP4/WebM video.
* **`audio(src, opts)`**: Renders an audio player.
* **`media(src, opts)`**: A generic block that automatically infers the media type based on the file extension.
* **`youtube(idOrUrl, opts?)`**: Renders a privacy-friendly YouTube embed (via `youtube-nocookie.com`).

## Interactive Blocks

* **`divider()`**: Adds a visual separator rule.
* **`quiz(src, opts?)`**: Renders an interactive multiple-choice quiz from a JSON file. See [Quizzes](./quizzes.md).
* **`simulation(src, opts)` / `lab(src, opts)` / `animation(src, opts)`**: Injects interactive Javascript simulations securely via sandboxed iframes. See [Simulations](./simulations.md).
