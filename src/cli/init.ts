import * as fs from "fs";
import * as path from "path";

export async function runInit() {
	console.log("Initializing mr-md project structure...");

	const dirs = [
		"chapters",
		"chapters/01-chapter",
		"chapters/01-chapter/lessons",
		"chapters/01-chapter/lessons/01-lesson",
		"chapters/01-chapter/lessons/01-lesson/sims",
		"chapters/01-chapter/lessons/01-lesson/media",
		"chapters/01-chapter/lessons/01-lesson/quizes",
	];

	for (const dir of dirs) {
		const fullPath = path.resolve(process.cwd(), dir);
		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath, { recursive: true });
			console.log(`  Created directory: ${dir}`);
		}
	}

	const chapterTsPath = path.resolve(process.cwd(), "chapters/01-chapter/chapter.ts");
	if (!fs.existsSync(chapterTsPath)) {
		fs.writeFileSync(chapterTsPath, `import { chapter } from "mr-md";
import { firstLesson } from "./lessons/01-lesson/lesson.js";

export const firstChapter = chapter("First Chapter", ctx => {
	ctx.lesson(firstLesson);
});

if (import.meta.main) {
	firstChapter.build();
}
`, "utf-8");
		console.log("  Created: chapters/01-chapter/chapter.ts");
	}

	const lessonTsPath = path.resolve(process.cwd(), "chapters/01-chapter/lessons/01-lesson/lesson.ts");
	if (!fs.existsSync(lessonTsPath)) {
		fs.writeFileSync(lessonTsPath, `import { lesson } from "mr-md";

export const firstLesson = lesson("First Lesson", { contentBase: import.meta.dir }, ctx => {
	ctx.markdown("Welcome to your first lesson!");
});
`, "utf-8");
		console.log("  Created: chapters/01-chapter/lessons/01-lesson/lesson.ts");
	}

	console.log("Done! You can now run `bun chapters/01-chapter/chapter.ts` to build your project.");
}
