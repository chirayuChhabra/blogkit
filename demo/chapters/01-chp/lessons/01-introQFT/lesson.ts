import { lesson } from "../../../../../src/index.js";

export const introQFT = lesson("Introduction to Quantum Fields", { contentBase: import.meta.dir }, ctx => {
	ctx.markdown("content/intro.md");
	ctx.quiz("quizes/quiz.json");
	ctx.lab("sims/3d-fields.js", { label: "3D Quantum Fields" });
	ctx.lab("sims/standard-model.js", { label: "The Standard Model" });
	ctx.lab("sims/annihilation.js", { label: "Matter-Antimatter Annihilation" });
	ctx.lab("sims/vacuum.js", { label: "Quantum Vacuum Excitations" });
});
