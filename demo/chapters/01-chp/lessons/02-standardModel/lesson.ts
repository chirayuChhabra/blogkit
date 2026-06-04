import { lesson } from "../../../../../src/index.js";

export const standardModel = lesson("Standard Model & Matter", { contentBase: import.meta.dir })
	.markdown("content/intro.md")
	.quiz("quizes/quiz.json")
	.lab("sims/sim.js");
