import { chapter } from "mr-md";
import { firstLesson } from "./lessons/01-lesson/lesson.js";

export const firstChapter = chapter("First Chapter", ctx => {
	ctx.lesson(firstLesson);
});

if (import.meta.main) {
	firstChapter.build();
}
