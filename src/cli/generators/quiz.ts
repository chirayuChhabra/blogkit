import * as fs from "fs";
import * as path from "path";

export async function generateQuiz(name: string, cwd: string) {
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
		const lessonCall = calls.find(
			(c: any) => c.getExpression().getText() === "lesson",
		);

		if (lessonCall) {
			const args = lessonCall.getArguments();
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
						?.addStatements(`ctx.quiz("quizzes/${name}.json");`);
					sourceFile.saveSync();
					console.log(`Auto-added quiz to lesson.ts`);
				} else {
					console.warn(
						"  ⚠ Could not auto-import quiz: lesson callback must use { } block syntax.",
					);
				}
			} else {
				console.warn(
					"  ⚠ Could not auto-import quiz: could not find lesson callback.",
				);
			}
		} else {
			console.warn(
				"  ⚠ Could not auto-import quiz: could not find lesson() call.",
			);
		}
	}
}
