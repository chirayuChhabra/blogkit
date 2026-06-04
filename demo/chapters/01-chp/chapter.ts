import { chapter } from "../../../src/index.js";
import { introQFT } from "./lessons/01-introQFT/lesson.js";
import { standardModel } from "./lessons/02-standardModel/lesson.js";

export const firstChapter = chapter("Quantum Field Theory", ctx => {
	ctx.lesson(introQFT);
	ctx.lesson(standardModel);
});

// When run directly with bun:
if (import.meta.main) {
	firstChapter.build();
}
