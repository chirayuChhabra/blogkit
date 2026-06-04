import { lesson } from "mr-md";

export const firstLesson = lesson("First Lesson", { contentBase: import.meta.dir }, ctx => {
	ctx.markdown("Welcome to your first lesson!");
});
