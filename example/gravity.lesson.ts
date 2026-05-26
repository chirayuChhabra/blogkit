import { lesson } from "../src/index";
import * as path from "path";

const contentBase = path.join(__dirname, "content");

export default lesson("Gravity: From Newton to Einstein", {
  outDir: path.join(__dirname, "out"),
  contentBase,
  theme: "auto",
  palette: "ember", // Use a different palette to showcase customizability
  preset: { layout: "lab", tone: "scholarly" },
})
  .description(
    "A journey through the mechanics of the cosmos. Discover how our understanding of gravity evolved from an invisible tether to the curvature of spacetime.",
  )
  .tags("physics", "astrophysics", "relativity")
  .author("Chirayu")

  .chapter("gravity-intro.md")

  .columns(
    [
      { markdown: "Newton's Universal Law of Gravitation describes an attractive force between all masses." },
      { latex: "F = G\\frac{m_1 m_2}{r^2}" },
    ],
    { label: "The Universal Law" },
  )

  .lab("../orbit-lab.js", {
    label: "Orbital Mechanics Lab",
    caption: "Adjust the mass of the central star and the velocity of the planet to see different orbital shapes.",
  })

  .important(
    "While Newton's math was incredibly precise, it had a glaring conceptual flaw: it assumed gravity acted instantaneously across vast distances, with no mechanism for *how* the force was transmitted.",
  )

  .quiz("gravity-quiz-1.json", {
    label: "Checkpoint: Newtonian Physics",
  })

  .divider()

  .section("gravity-einstein.md", "The Fabric of Spacetime")

  .youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { 
    label: "Spacetime demonstration",
    caption: "A classic demonstration of gravity."
  })

  .lab("../three-body.js", {
    label: "The Chaotic 3-Body Problem",
    caption: "Under Newton's laws, adding just one more body to an orbit creates unpredictable, chaotic motion. Drag the slider to perturb the starting conditions.",
  })

  .note("Einstein's General Relativity didn't just fix the 'instantaneous' problem—it predicted entirely new phenomena, like black holes and gravitational waves, which we now observe regularly.")

  .quiz("gravity-quiz-2.json", {
    label: "Final Review",
  })

  .build();
