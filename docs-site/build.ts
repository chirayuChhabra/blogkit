import { chapter, lesson } from "../src/index.js";
import path from "node:path";

const root = path.join(import.meta.dir, "..");

const showcase = lesson("Showcase", { contentBase: root }, ctx => {
  ctx.markdown("Welcome to Mr Markdown! This site serves as both the official documentation and a live showcase of what you can build.");
  ctx.divider();

  ctx.heading("Callouts & Notifications", "Callouts");
  ctx.important("This is an **important** callout. Use it to highlight critical information like breaking changes or security warnings.");
  ctx.tip("This is a **tip** callout. It's perfect for highlighting best practices or performance optimizations.");
  ctx.note("This is a **note** callout. It's great for adding background context without distracting from the main lesson.");
  ctx.warning("This is a **warning** callout. Use it to warn users about deprecated APIs or potential pitfalls.");
  ctx.divider();

  ctx.heading("Media & Layout", "Media");
  ctx.columns([
    {
      markdown: "### Advanced Layouts\n\nCreate side-by-side columns effortlessly. This is great for putting code or math next to an explanation. On mobile, this will automatically stack vertically!"
    },
    {
      latex: "e^{i\\pi} + 1 = 0"
    }
  ]);
  ctx.image("docs-site/media/nature.jpg", { alt: "Moraine Lake natural landscape", caption: "A beautiful landscape image embedded natively." });
  ctx.youtube("https://www.youtube.com/watch?v=riXcZT2ICjA", { caption: "A Khan Academy YouTube video embed." });
  ctx.divider();

  ctx.heading("Live Demonstrations", "Live Demos");
  ctx.markdown("Mr Markdown supports rich, interactive components. Try out these live simulations and the quiz below!");
  
  ctx.lab("docs-site/sims/qcd.js", { label: "Proton & Quarks", caption: "Interactive QCD string breaking. Drag a quark to pull it out of the proton." });
  ctx.lab("docs-site/sims/pathfinder.js", { label: "Pathfinding Visualizer", caption: "A* Algorithm solving a maze. Drag the green start and red end nodes, or change the maze density." });
  ctx.quiz("docs-site/quizzes/sample.json", { label: "Mr Markdown Quiz", caption: "A sample interactive quiz." });
});

const setup = lesson("1. Setup", { contentBase: root }, ctx => {
  ctx.markdown("docs/01a-setup.md");
  ctx.tip("Alternatively, you can `cd` into the specific chapter folder and simply run `bun run dev`");
  ctx.markdown("docs/01b-setup.md");
});

const firstLesson = lesson("2. First Lesson", { contentBase: root }, ctx => {
  ctx.markdown("docs/02-first-lesson.md");
});

const coreBlocks = lesson("3. Core Blocks", { contentBase: root }, ctx => {
  ctx.markdown("docs/03a-core-blocks.md");
  ctx.note("The second argument is a short label used specifically for the sidebar navigation. If omitted, the full title is used.");
  ctx.markdown("docs/03b-core-blocks.md");
});

const mediaAndMath = lesson("4. Media & Math", { contentBase: root }, ctx => {
  ctx.markdown("docs/04a-media.md");
  
  ctx.space(2);
  ctx.heading("Live Examples", "Live Examples");
  
  ctx.markdown("Here is an actual video embedded using `ctx.youtube()`:");
  ctx.youtube("https://www.youtube.com/watch?v=riXcZT2ICjA", { caption: "YouTube embed demo" });
  ctx.space(2);
  
  ctx.markdown("Here is a local image embedded using `ctx.image()`:");
  ctx.image("docs-site/media/nature.jpg", { alt: "Nature scene", caption: "Local image embed" });
  ctx.space(2);

  ctx.markdown("Here is a standalone LaTeX block embedded using `ctx.latex()`:");
  ctx.latex("e^{i\\pi} + 1 = 0");
  
  ctx.space(2);
  ctx.divider();

  ctx.markdown("docs/04b-math.md");
});

const simulations = lesson("5. Simulations", { contentBase: root }, ctx => {
  ctx.markdown("docs/05a-simulations.md");
  ctx.note("There is also `ctx.animation()`, which behaves exactly the same but hides the \"Click to interact\" overlay, intended for passive motion demos.");
  ctx.markdown("docs/05b-simulations.md");
  ctx.warning("**CRITICAL: Setting `contentBase`**\n\nFor Mr Markdown to automatically discover your `.config.json` file, you MUST pass the `{ contentBase: import.meta.dir }` option to your `lesson()` definition! Otherwise, the sliders will not render.");
  ctx.markdown("docs/05c-simulations.md");
  ctx.divider();
  ctx.heading("Live Example", "Live Example");
  ctx.markdown("Here is what an interactive lab looks like when embedded using `ctx.lab('sims/qcd.js')`! Go ahead and interact with it:");
  ctx.lab("docs-site/sims/qcd.js", { label: "Proton & Quarks", caption: "Interactive QCD string breaking. Drag a quark to pull it out of the proton." });
});

const quizzes = lesson("6. Quizzes", { contentBase: root }, ctx => {
  ctx.markdown("docs/06a-quizzes.md");
  ctx.note("You can also use the `ctx.add(\"quizzes/knowledge-check.json\")` smart router, which behaves identically.");
  ctx.markdown("docs/06b-quizzes.md");
  ctx.divider();
  ctx.heading("Live Example", "Live Example");
  ctx.markdown("Here is a live quiz embedded using `ctx.quiz('quizzes/sample.json')`:");
  ctx.quiz("docs-site/quizzes/sample.json", { label: "Mr Markdown Quiz", caption: "Test your knowledge!" });
});

const publishing = lesson("7. Publishing", { contentBase: root }, ctx => {
  ctx.markdown("docs/07a-publishing.md");
  ctx.note("Easter egg: In the generated UI settings panel, readers can **double-click** a palette color to unlock special evolved color palettes!");
  ctx.markdown("docs/07b-publishing.md");
});

export const docsChapter = chapter("Mr Markdown Documentation", { outDir: "docs-site/out", contentBase: root, standalone: false }, ctx => {
  ctx.slug("index");
  ctx.lesson(showcase);
  ctx.lesson(setup);
  ctx.lesson(firstLesson);
  ctx.lesson(coreBlocks);
  ctx.lesson(mediaAndMath);
  ctx.lesson(simulations);
  ctx.lesson(quizzes);
  ctx.lesson(publishing);
});

if (import.meta.main) {
  docsChapter.build();
}
