import { firstStepsLesson } from "./lessons/01-first-steps/lesson.js";
import { chapter } from "mr-md";

export const gettingStartedChapter = chapter("Getting Started", ctx => {
	ctx.lesson(firstStepsLesson);
	// Add lessons here
});

if (import.meta.main) {
	gettingStartedChapter.build();
}
