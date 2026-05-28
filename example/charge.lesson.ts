import * as path from "path";
import { lesson } from "../src/index";

const _contentBase = path.join(__dirname, "content");

export default lesson("Charge is a Mystery", {
	theme: "auto",
	preset: { layout: "lab", tone: "scholarly" },
})
	.description(
		"Why does electric charge exist? A deep dive from everyday physics to quantum field theory.",
	)
	.tags("physics", "electromagnetism", "quantum")
	.author("Chirayu")
	.status("read")

	.heading("chargeIsAMystery.md")

	.add("../chargesInteractive.js", {
		label: "Electric field explorer",
		caption: "Drag the charges to see how the field changes in real time.",
	})

	.add("chargeInQFT.md")

	.divider()

	.section("chargeAsWeKnowIt.md")

	.columns(
		[
			{ markdown: "Force grows with charge and weakens with distance." },
			{ latex: "F = k\\frac{q_1 q_2}{r^2}" },
		],
		{ label: "Law and intuition" },
	)

	.important(
		"Conservation of charge is one of the most precisely tested laws in physics — verified to 1 part in 10²¹.",
	)

	.note("conservationOfCharge.md")

	.add("chargeQuestions.json", {
		label: "Review questions",
		caption: "Immediate feedback keeps the lesson self-checking.",
	});
