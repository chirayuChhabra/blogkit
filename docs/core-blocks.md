# Core Blocks

Mr Markdown provides a fluent callback API where you use the `ctx` object inside the `lesson()` builder to add blocks of content sequentially.

## The Smart `ctx.add()` Router

For most use cases, you don't need to memorize specific method names. The universal `ctx.add(src)` method automatically infers the correct block type based on the file extension or URL provided.

* **`ctx.add("file.md")`** → Parses as standard Markdown.
* **`ctx.add("sim.js")`** → Mounts an Interactive Lab. (JS/TS files are automatically bundled for the browser).
* **`ctx.add("questions.json")`** → Renders an Interactive Quiz.
* **`ctx.add("video.mp4")`** → Embeds a local video.
* **`ctx.add("image.png")`** → Embeds an image.
* **`ctx.add("https://youtu.be/...")`** → Embeds a YouTube video.

```ts
export const myLesson = lesson("My Lesson", { contentBase: import.meta.dir }, ctx => {
  ctx.add("intro.md");
  ctx.add("sim.js", { label: "Electric field explorer" });
  ctx.add("questions.json");
});
```

If you need specific layout semantics (like a new major heading, callouts, or columns), you can use the targeted layout blocks below on the `ctx` object (e.g. `ctx.heading()`).

## Text & Markdown

* **`heading(src, title?)`**: Creates a primary section heading (H1) and a corresponding entry in the sidebar navigation.
* **`section(src, label?)`**: Creates a subsection heading (H2) and a nested entry in the sidebar navigation.
* **`content(src)` / `markdown(src)`**: Adds standard prose from a markdown file without creating a new sidebar entry.
* **`code(src, lang?, label?)`**: Displays the source code from a file with syntax highlighting.

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

* **`image(src, opts)`**: Renders an image. *Note: In strict mode, you must provide `alt` text.* (Assets are automatically extracted and bundled in the `out/assets` directory).
* **`video(src, opts)`**: Renders an MP4/WebM video.
* **`audio(src, opts)`**: Renders an audio player.
* **`media(src, opts)`**: A generic block that automatically infers the media type based on the file extension.
* **`youtube(idOrUrl, opts?)`**: Renders a privacy-friendly YouTube embed (via `youtube-nocookie.com`).

## Interactive Blocks

* **`divider()`**: Adds a visual separator rule.
* **`quiz(src, opts?)`**: Renders an interactive multiple-choice quiz from a JSON file. See [Quizzes](./quizzes.md).
* **`simulation(src, opts)` / `lab(src, opts)` / `animation(src, opts)`**: Injects interactive Javascript simulations securely via sandboxed iframes. See [Simulations](./simulations.md).
