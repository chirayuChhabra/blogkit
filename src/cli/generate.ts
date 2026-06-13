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
		console.error("Usage: md g <ch|le|qu|chapter|lesson|quiz> <name>");
		process.exit(1);
	}
	
	const name = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
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
		case "le":
		case "lesson": {
			// Assume we are in a chapter directory
			const lessonsDir = path.join(cwd, "lessons");
			if (!fs.existsSync(lessonsDir)) fs.mkdirSync(lessonsDir, { recursive: true });
			
			const prefix = getNextPrefix(lessonsDir);
			const lessonDirName = `${prefix}-${name}`;
			const lessonPath = path.join(lessonsDir, lessonDirName);
			
			fs.mkdirSync(lessonPath, { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "sims"), { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "media"), { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "quizzes"), { recursive: true });
			fs.mkdirSync(path.join(lessonPath, "content"), { recursive: true });
			
			const lessonTitle = rawName.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
			const varName = name.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
			
			const content = `import { lesson } from "mr-md";

export const ${varName}Lesson = lesson("${lessonTitle}", { contentBase: import.meta.dir }, ctx => {
});
`;
			fs.writeFileSync(path.join(lessonPath, "lesson.ts"), content, "utf-8");
			console.log(`Generated Lesson: lessons/${lessonDirName}`);
			
			// Auto import into chapter.ts
			const chapterFile = path.join(cwd, "chapter.ts");
			if (fs.existsSync(chapterFile)) {
				const { Project, SyntaxKind } = await import("ts-morph");
				const project = new Project();
				const sourceFile = project.addSourceFileAtPath(chapterFile);
				
				// 1. Add the import
				sourceFile.addImportDeclaration({
					namedImports: [`${varName}Lesson`],
					moduleSpecifier: `./lessons/${lessonDirName}/lesson.js`
				});

				// 2. Find the chapter(...) call and inject ctx.lesson()
				const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
				const chapterCall = calls.find((c: any) => c.getExpression().getText() === "chapter");
				
				if (chapterCall) {
					const args = chapterCall.getArguments();
					const callback = args.find((a: any) => a.getKind() === SyntaxKind.ArrowFunction || a.getKind() === SyntaxKind.FunctionExpression);
					if (callback) {
						const arrow = callback.asKind(SyntaxKind.ArrowFunction);
						const func = callback.asKind(SyntaxKind.FunctionExpression);
						const body = arrow ? arrow.getBody() : func ? func.getBody() : null;
						if (body && body.getKind() === SyntaxKind.Block) {
							body.asKind(SyntaxKind.Block)?.addStatements(`ctx.lesson(${varName}Lesson);`);
						} else {
							console.warn("  ⚠ Could not auto-import: chapter callback must use { } block syntax.");
						}
					} else {
						console.warn("  ⚠ Could not auto-import: could not find chapter callback.");
					}
				}
				
				sourceFile.saveSync();
				console.log(`Auto-imported ${varName}Lesson into chapter.ts`);
			}
			break;
		}
		case "qu":
		case "quiz": {
			// Assume we are in a lesson directory
			const quizzesDir = path.join(cwd, "quizzes");
			if (!fs.existsSync(quizzesDir)) fs.mkdirSync(quizzesDir, { recursive: true });
			
			const quizPath = path.join(quizzesDir, `${name}.json`);
			
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
			console.log(`Generated Quiz: quizzes/${name}.json`);
			
			// Auto import into lesson.ts
			const lessonFile = path.join(cwd, "lesson.ts");
			if (fs.existsSync(lessonFile)) {
				const { Project, SyntaxKind } = await import("ts-morph");
				const project = new Project();
				const sourceFile = project.addSourceFileAtPath(lessonFile);
				
				const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
				const lessonCall = calls.find((c: any) => c.getExpression().getText() === "lesson");
				
				if (lessonCall) {
					const args = lessonCall.getArguments();
					const callback = args.find((a: any) => a.getKind() === SyntaxKind.ArrowFunction || a.getKind() === SyntaxKind.FunctionExpression);
					if (callback) {
						const arrow = callback.asKind(SyntaxKind.ArrowFunction);
						const func = callback.asKind(SyntaxKind.FunctionExpression);
						const body = arrow ? arrow.getBody() : func ? func.getBody() : null;
						if (body && body.getKind() === SyntaxKind.Block) {
							body.asKind(SyntaxKind.Block)?.addStatements(`ctx.quiz("quizzes/${name}.json");`);
						} else {
							console.warn("  ⚠ Could not auto-import quiz: lesson callback must use { } block syntax.");
						}
					} else {
						console.warn("  ⚠ Could not auto-import quiz: could not find lesson callback.");
					}
				}
				
				sourceFile.saveSync();
				console.log(`Auto-added quiz to lesson.ts`);
			}
			
			break;
		}
		default:
			console.error(`Unknown generator type: ${type}`);
	}
}
