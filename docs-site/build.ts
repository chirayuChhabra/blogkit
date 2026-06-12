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
  ctx.heading("Live Simulations", "Live Sims");
  ctx.markdown("One of the most powerful features of Mr Markdown is the ability to securely embed interactive Javascript simulations. Below are some fully functional simulations embedded using the `.lab()` method. Try interacting with them!");
  
  ctx.markdown("### Physics: Quantum Chromodynamics (QCD)");
  ctx.markdown("An interactive simulation of a Proton. Pull a quark to see the strong force stretch and snap, creating a meson via hadronization!");
  ctx.lab("sims/qcd.js", { label: "Proton & Quarks", caption: "Interactive QCD string breaking. Drag a quark to pull it out of the proton." });
  ctx.divider();

  ctx.markdown("### Computer Science: Interactive A* Pathfinding");
  ctx.markdown("An interactive visualization of the A* search algorithm. Drag the start/end points or change the maze density to see it solve in real-time.");
  ctx.lab("sims/pathfinder.js", { label: "Pathfinding Visualizer", caption: "A* Algorithm solving a maze. Drag the green start and red end nodes, or change the maze density." });
  ctx.divider();

  ctx.markdown("### Biology: Neural Action Potentials");
  ctx.markdown("An organic neural network simulation showing electrical impulse cascades. Click a neuron to fire it!");
  ctx.lab("sims/neuron.js", { label: "Neural Network", caption: "Action potentials propagating through a neural network. Click any soma to fire an impulse." });
  ctx.divider();

  ctx.markdown("content/simulations.md");
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

const cli = lesson("CLI", ctx => {
  ctx.markdown("content/cli.md");
});

export const docsChapter = chapter("Mr Markdown Documentation", { outDir: "docs-site/out", contentBase: import.meta.dir }, ctx => {
  ctx.slug("index");
  ctx.lesson(quickstart);
  ctx.lesson(coreBlocks);
  ctx.lesson(simulations);
  ctx.lesson(quizzes);
  ctx.lesson(themes);
  ctx.lesson(cli);
  ctx.lesson(production);
});

if (import.meta.main) {
  docsChapter.build();
}
