import { generateChapter } from "./generators/chapter.js";
import { generateLesson } from "./generators/lesson.js";
import { generateQuiz } from "./generators/quiz.js";

export async function runGenerate(args: string[]) {
	const type = args[0];
	const rawName = args[1];

	if (!type || !rawName) {
		console.error("Usage: md g <ch|le|qu|chapter|lesson|quiz> <name>");
		process.exit(1);
	}

	const name =
		rawName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "") || "item";
	const cwd = process.cwd();

	switch (type) {
		case "ch":
		case "chapter":
			generateChapter(name, rawName, cwd);
			break;
		case "le":
		case "lesson":
			await generateLesson(name, rawName, cwd);
			break;
		case "qu":
		case "quiz":
			await generateQuiz(name, cwd);
			break;
		default:
			console.error(`Unknown generator type: ${type}`);
	}
}
