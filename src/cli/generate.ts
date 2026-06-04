import * as fs from "fs";
import * as path from "path";

function getNextPrefix(dirPath: string): string {
	if (!fs.existsSync(dirPath)) return "01";
	
	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	let maxPrefix = 0;
	
	for (const file of files) {
		if (file.isDirectory()) {
			const match = file.name.match(/^(\d+)-/);
			if (match) {
				const num = parseInt(match[1], 10);
				if (num > maxPrefix) {
					maxPrefix = num;
				}
			}
		}
	}
	
	const next = maxPrefix + 1;
	return next.toString().padStart(2, "0");
}

export async function runGenerate(args: string[]) {
	const type = args[0];
	const rawName = args[1];
	
	if (!type || !rawName) {
		console.error("Usage: mr-md g <ch|lesson|quiz|sim> <name>");
		process.exit(1);
	}
	
	const name = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
	const cwd = process.cwd();
	
	switch (type) {
		case "ch":
		case "chapter": {
			const chaptersDir = path.join(cwd, "chapters");
			if (!fs.existsSync(chaptersDir)) fs.mkdirSync(chaptersDir, { recursive: true });
			
			const prefix = getNextPrefix(chaptersDir);
			const chapterDirName = `${prefix}-${name}`;
			const chapterPath = path.join(chaptersDir, chapterDirName);
			
			fs.mkdirSync(chapterPath, { recursive: true });
			fs.mkdirSync(path.join(chapterPath, "lessons"), { recursive: true });
			
			const varName = name.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
			const chapterTitle = rawName.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
			
			const content = `import { chapter } from "mr-md";

export const ${varName}Chapter = chapter("${chapterTitle}", ctx => {
	// Add lessons here
});

if (import.meta.main) {
	${varName}Chapter.build();
}
`;
			fs.writeFileSync(path.join(chapterPath, "chapter.ts"), content, "utf-8");
			console.log(`Generated Chapter: chapters/${chapterDirName}`);
			break;
		}
		case "lesson": {
			// Assume we are in a chapter directory
			const lessonsDir = path.join(cwd, "lessons");
			if (!fs.existsSync(lessonsDir)) fs.mkdirSync(lessonsDir, { recursive: true });
			
			const prefix = getNextPrefix(lessonsDir);
			const lessonDirName = `${prefix}-${name}`;
			const lessonPath = path.join(lessonsDir, lessonDirName);
			
			fs.mkdirSync(lessonPath, { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "sims"), { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "quizes"), { recursive: true });
			
			const lessonTitle = rawName.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
			const varName = name.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
			
			const content = `import { lesson } from "mr-md";

export const ${varName}Lesson = lesson("${lessonTitle}", { contentBase: import.meta.dir }, ctx => {
	// Add markdown, quizes, sims here
});
`;
			fs.writeFileSync(path.join(lessonPath, "lesson.ts"), content, "utf-8");
			console.log(`Generated Lesson: lessons/${lessonDirName}`);
			
			// Auto import into chapter.ts
			const chapterFile = path.join(cwd, "chapter.ts");
			if (fs.existsSync(chapterFile)) {
				let chapterContent = fs.readFileSync(chapterFile, "utf-8");
				
				// Very basic auto-import regex for demonstration
				chapterContent = `import { ${varName}Lesson } from "./lessons/${lessonDirName}/lesson.js";\n` + chapterContent;
				
				// Inject into builder chronologically (before the comment)
				chapterContent = chapterContent.replace(/(\t\/\/\s*Add lessons here)/, `\tctx.lesson(${varName}Lesson);\n$1`);
				
				// Fallback if comment was removed
				if (!chapterContent.includes(`ctx.lesson(${varName}Lesson)`)) {
					chapterContent = chapterContent.replace(/(chapter\([^,]+, ctx => \{)/, `$1\n\tctx.lesson(${varName}Lesson);`);
				}
				
				fs.writeFileSync(chapterFile, chapterContent, "utf-8");
				console.log(`Auto-imported ${name}Lesson into chapter.ts`);
			}
			break;
		}
		case "quiz": {
			// Assume we are in a lesson directory
			const quizesDir = path.join(cwd, "quizes");
			if (!fs.existsSync(quizesDir)) fs.mkdirSync(quizesDir, { recursive: true });
			
			const quizPath = path.join(quizesDir, `${name}.json`);
			
			const content = `{
	"questions": [
		{
			"q": "Sample question?",
			"options": ["A", "B"],
			"answer": 0
		}
	]
}
`;
			fs.writeFileSync(quizPath, content, "utf-8");
			console.log(`Generated Quiz: quizes/${name}.json`);
			
			// Auto import into lesson.ts
			const lessonFile = path.join(cwd, "lesson.ts");
			if (fs.existsSync(lessonFile)) {
				let lessonContent = fs.readFileSync(lessonFile, "utf-8");
				lessonContent = lessonContent.replace(/(\t\/\/\s*Add markdown, quizes, sims here)/, `\tctx.quiz("quizes/${name}.json");\n$1`);
				
				// Fallback if comment was removed
				if (!lessonContent.includes(`ctx.quiz("quizes/${name}.json")`)) {
					lessonContent = lessonContent.replace(/(lesson\([^,]+,[^,]+, ctx => \{)/, `$1\n\tctx.quiz("quizes/${name}.json");`);
				}
				fs.writeFileSync(lessonFile, lessonContent, "utf-8");
				console.log(`Auto-added quiz to lesson.ts`);
			}
			
			break;
		}
		default:
			console.error(`Unknown generator type: ${type}`);
	}
}
