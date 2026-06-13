import { chapter, lesson } from "../src/index.js";

const showcase = lesson("Showcase", ctx => {
  ctx.markdown("content/showcase.md");
  ctx.divider();

  ctx.heading("Callouts & Notifications", "Callouts");
  ctx.important("This is an **important** callout. Use it to highlight critical information like breaking changes or security warnings.");
  ctx.tip("This is a **tip** callout. It's perfect for highlighting best practices or performance optimizations.");
  ctx.note("This is a **note** callout. It's great for adding background context without distracting from the main lesson.");
  ctx.warning("This is a **warning** callout. Use it to warn users about deprecated APIs or potential pitfalls.");
  ctx.divider();

  ctx.heading("Media & Code", "Media & Code");
  ctx.code('import { chapter, lesson } from "mr-markdown";\n\nconst quickstart = lesson("Quick Start", ctx => {\n  ctx.markdown("Welcome to the quick start guide!");\n});\n\nexport const docsChapter = chapter("Documentation", { outDir: "out" }, ctx => {\n  ctx.lesson(quickstart);\n});', 'typescript', 'chapter.ts');
  ctx.columns([
    {
      markdown: "### Advanced Layouts\n\nCreate side-by-side columns effortlessly. This is great for putting code or math next to an explanation."
    },
    {
      latex: "e^{i\\pi} + 1 = 0"
    }
  ]);
  ctx.image("media/nature.jpg", { alt: "Moraine Lake natural landscape", caption: "A beautiful landscape image embedded with `.image()`" });
  ctx.youtube("https://www.youtube.com/watch?v=riXcZT2ICjA", { caption: "A Khan Academy YouTube video embed using `.youtube()`" });
  ctx.divider();

  ctx.heading("Live Demonstrations", "Live Demos");
  ctx.markdown("Mr Markdown supports rich, interactive components. Try out these live simulations and the quiz below!");
  
  ctx.lab("sims/qcd.js", { label: "Proton & Quarks", caption: "Interactive QCD string breaking. Drag a quark!" });
  ctx.lab("sims/pathfinder.js", { label: "Pathfinding Visualizer", caption: "A* Algorithm solving a maze. Drag the green start and red end nodes, or change the maze density." });
  ctx.quiz("quizzes/sample.json", { label: "Mr Markdown Quiz", caption: "A sample interactive quiz." });
});

const quickstart = lesson("Quick Start", ctx => {
  ctx.markdown("content/quickstart.md");
});

const cli = lesson("CLI", ctx => {
  ctx.markdown("content/cli.md");
});

const coreBlocks = lesson("Core Blocks", ctx => {
  ctx.markdown("content/core-blocks.md");
  ctx.divider();
  ctx.heading("Live Demonstration", "Live Demo");
  ctx.markdown("Here is how callouts and media look when rendered by **Mr Markdown**. This is extremely useful for highlighting important context to your readers.");
  ctx.important("This is an **important** callout. Use it to highlight critical information like breaking changes or security warnings.");
  ctx.tip("This is a **tip** callout. It's perfect for highlighting best practices or performance optimizations.");
  ctx.note("This is a **note** callout. It's great for adding background context without distracting from the main lesson.");
  ctx.warning("This is a **warning** callout. Use it to warn users about deprecated APIs or potential pitfalls.");
  ctx.markdown("You can also embed beautiful, responsive media using the SDK:");
  ctx.image("media/nature.jpg", { alt: "Moraine Lake natural landscape", caption: "A beautiful landscape image embedded with `.image()`" });
  ctx.youtube("https://www.youtube.com/watch?v=riXcZT2ICjA", { caption: "A Khan Academy YouTube video embed using `.youtube()`" });
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

export const docsChapter = chapter("Mr Markdown Documentation", { outDir: "docs-site/out", contentBase: import.meta.dir, standalone: false }, ctx => {
  ctx.slug("index");
  ctx.lesson(showcase);
  ctx.lesson(quickstart);
  ctx.lesson(cli);
  ctx.lesson(coreBlocks);
  ctx.lesson(simulations);
  ctx.lesson(quizzes);
  ctx.lesson(themes);
  ctx.lesson(production);
});

if (import.meta.main) {
  docsChapter.build();
}
