import { chapter, lesson } from "../src/index.js";

const quickstart = lesson("Quick Start").markdown("content/quickstart.md");

const coreBlocks = lesson("Core Blocks")
  .markdown("content/core-blocks.md")
  .divider()
  .heading("Live Demonstration", "Live Demo")
  .markdown("Here is how callouts and media look when rendered by **Mr Markdown**. This is extremely useful for highlighting important context to your readers.")
  .important("This is an **important** callout! Use it for critical warnings, such as reminding students not to touch a high-voltage wire.")
  .tip("This is a **tip** callout! Great for helpful hints, like performance optimizations.")
  .note("This is a **note** callout! Ideal for extra context or background information that isn't strictly required.")
  .warning("This is a **warning**! Something to be careful about, like a deprecated feature.")
  .markdown("You can also embed beautiful, responsive media using the SDK:")
  .image("media/wave.png", { alt: "Abstract colorful wave", caption: "A beautiful image embedded with `.image()`" })
  .youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { caption: "A YouTube embed using `.youtube()`" });

const simulations = lesson("Simulations")
  .markdown("content/simulations.md")
  .divider()
  .heading("Live Simulation", "Live Sim")
  .markdown("One of the most powerful features of Mr Markdown is the ability to securely embed interactive Javascript simulations. Below is a fully functional simulation embedded using the `.lab()` method. Try interacting with it!")
  .lab("sims/vacuum.js", { label: "Quantum Vacuum Excitations" });

const quizzes = lesson("Quizzes")
  .markdown("content/quizzes.md")
  .divider()
  .heading("Try a Quiz!", "Sample Quiz")
  .markdown("Quizzes are an excellent way to reinforce learning. Here is a live interactive quiz embedded using `.quiz()`:")
  .quiz("quizzes/sample.json", { label: "Mr Markdown Quiz", caption: "Test your knowledge of the SDK!" });

const themes = lesson("Themes and Styling").markdown("content/themes-and-styling.md");
const production = lesson("Production Checks").markdown("content/production-checks.md");

const docsChapter = chapter("Mr Markdown Documentation", { outDir: "./out" })
  .lesson(quickstart)
  .lesson(coreBlocks)
  .lesson(simulations)
  .lesson(quizzes)
  .lesson(themes)
  .lesson(production);

if (import.meta.main) {
  docsChapter.build();
}
