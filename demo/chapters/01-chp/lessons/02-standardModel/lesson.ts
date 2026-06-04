import { lesson } from "../../../../../src/index.js";

export const standardModel = lesson("Standard Model & Matter", { contentBase: import.meta.dir }, ctx => {
	ctx.markdown("content/intro.md");
	ctx.quiz("quizes/quiz.json");
	ctx.lab("sims/sim.js");
});
