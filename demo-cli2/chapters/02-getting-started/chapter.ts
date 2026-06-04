import { chapter } from "mr-md";
import { firstStepsLesson } from "./lessons/01-first-steps/lesson.js";
import { secondStepsLesson } from "./lessons/02-second-steps/lesson.js";

export const gettingStartedChapter = chapter("Getting Started", ctx => {
	// Add lessons here
    ctx.lesson(firstStepsLesson);
    ctx.lesson(secondStepsLesson);
});

if (import.meta.main) {
	gettingStartedChapter.build();
}
