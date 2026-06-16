import * as fs from "fs";
import * as path from "path";
import { getNextPrefix } from "./utils.js";

export async function generateLesson(
	name: string,
	rawName: string,
	cwd: string,
) {
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

	const lessonTitle = rawName
		.replace(/-/g, " ")
		.replace(/\b\w/g, (l) => l.toUpperCase());
	let varName = name.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
	if (/^[0-9]/.test(varName)) varName = `_${varName}`;

	const content = `import { lesson, type LessonBuilder } from "mr-md";

export const ${varName}Lesson: LessonBuilder = lesson("${lessonTitle}", { contentBase: import.meta.dir }, (ctx: LessonBuilder) => {
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
			moduleSpecifier: `./lessons/${lessonDirName}/lesson.js`,
		});

		// 2. Find the chapter(...) call and inject ctx.lesson()
		const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
		const chapterCall = calls.find(
			(c: any) => c.getExpression().getText() === "chapter",
		);

		if (chapterCall) {
			const args = chapterCall.getArguments();
			const callback = args.find(
				(a: any) =>
					a.getKind() === SyntaxKind.ArrowFunction ||
					a.getKind() === SyntaxKind.FunctionExpression,
			);
			if (callback) {
				const arrow = callback.asKind(SyntaxKind.ArrowFunction);
				const func = callback.asKind(SyntaxKind.FunctionExpression);
				const body = arrow ? arrow.getBody() : func ? func.getBody() : null;
				if (body && body.getKind() === SyntaxKind.Block) {
					body
						.asKind(SyntaxKind.Block)
						?.addStatements(`ctx.lesson(${varName}Lesson);`);
					sourceFile.saveSync();
					console.log(`Auto-imported ${varName}Lesson into chapter.ts`);
				} else {
					console.warn(
						"  ⚠ Could not auto-import: chapter callback must use { } block syntax.",
					);
				}
			} else {
				console.warn(
					"  ⚠ Could not auto-import: could not find chapter callback.",
				);
			}
		} else {
			console.warn("  ⚠ Could not auto-import: could not find chapter() call.");
		}
	}
}
