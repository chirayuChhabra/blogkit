import { chapter, lesson } from "../src/index.js";

const quickstart = lesson("Quick Start", ctx => {
  ctx.markdown("content/quickstart.md");
});

const coreBlocks = lesson("Core Blocks", ctx => {
  ctx.markdown("content/core-blocks.md");
  ctx.divider();
  ctx.heading("Live Demonstration", "Live Demo");
  ctx.markdown("Here is how callouts and media look when rendered by **Mr Markdown**. This is extremely useful for highlighting important context to your readers.");
  ctx.important("This is an **important** callout! Use it for critical warnings, such as reminding students not to touch a high-voltage wire.");
  ctx.tip("This is a **tip** callout! Great for helpful hints, like performance optimizations.");
  ctx.note("This is a **note** callout! Ideal for extra context or background information that isn't strictly required.");
  ctx.warning("This is a **warning**! Something to be careful about, like a deprecated feature.");
  ctx.markdown("You can also embed beautiful, responsive media using the SDK:");
  ctx.image("media/wave.png", { alt: "Abstract colorful wave", caption: "A beautiful image embedded with `.image()`" });
  ctx.youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { caption: "A YouTube embed using `.youtube()`" });
});

const simulations = lesson("Simulations", ctx => {
  ctx.markdown("content/simulations.md");
  ctx.divider();
  ctx.heading("Live Simulation", "Live Sim");
  ctx.markdown("One of the most powerful features of Mr Markdown is the ability to securely embed interactive Javascript simulations. Below is a fully functional simulation embedded using the `.lab()` method. Try interacting with it!");
  ctx.lab("sims/vacuum.js", { label: "Quantum Vacuum Excitations" });
});

const quizzes = lesson("Quizzes", ctx => {
  ctx.markdown("content/quizzes.md");
  ctx.divider();
  ctx.heading("Try a Quiz!", "Sample Quiz");
  ctx.markdown("Quizzes are an excellent way to reinforce learning. Here is a live interactive quiz embedded using `.quiz()`:");
  ctx.quiz("quizzes/sample.json", { label: "Mr Markdown Quiz", caption: "Test your knowledge of the SDK!" });
});

const themes = lesson("Themes and Styling", ctx => {
  ctx.markdown("content/themes-and-styling.md");
});

const production = lesson("Production Checks", ctx => {
  ctx.markdown("content/production-checks.md");
});

export const docsChapter = chapter("Mr Markdown Documentation", { outDir: "./out", contentBase: import.meta.dir }, ctx => {
  ctx.lesson(quickstart);
  ctx.lesson(coreBlocks);
  ctx.lesson(simulations);
  ctx.lesson(quizzes);
  ctx.lesson(themes);
  ctx.lesson(production);
});

if (import.meta.main) {
  docsChapter.build();
}
