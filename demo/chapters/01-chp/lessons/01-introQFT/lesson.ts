import { lesson } from "../../../../../src/index.js";

export const introQFT = lesson("Introduction to Quantum Fields", { contentBase: import.meta.dir })
	.markdown("content/intro.md")
	.quiz("quizes/quiz.json")
	.lab("sims/3d-fields.js", { label: "3D Quantum Fields" })
	.lab("sims/standard-model.js", { label: "The Standard Model" })
	.lab("sims/annihilation.js", { label: "Matter-Antimatter Annihilation" })
	.lab("sims/vacuum.js", { label: "Quantum Vacuum Excitations" });
