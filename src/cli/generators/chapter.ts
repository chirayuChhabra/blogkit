import * as fs from "fs";
import * as path from "path";
import { getNextPrefix } from "./utils.js";

export function generateChapter(name: string, rawName: string, cwd: string) {
	const chaptersDir = path.join(cwd, "chapters");
	if (!fs.existsSync(chaptersDir))
		fs.mkdirSync(chaptersDir, { recursive: true });

	const prefix = getNextPrefix(chaptersDir);
	const chapterDirName = `${prefix}-${name}`;
	const chapterPath = path.join(chaptersDir, chapterDirName);

	fs.mkdirSync(chapterPath, { recursive: true });
	fs.mkdirSync(path.join(chapterPath, "lessons"), { recursive: true });

	let varName = name.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
	if (/^[0-9]/.test(varName)) varName = `_${varName}`;
	const chapterTitle = rawName
		.replace(/-/g, " ")
		.replace(/\b\w/g, (l) => l.toUpperCase());

	const content = `import { chapter, type ChapterBuilder } from "mr-md";

export const ${varName}Chapter = chapter("${chapterTitle}", (ctx: ChapterBuilder) => {
});

if (import.meta.main) {
	${varName}Chapter.build();
}
`;
	fs.writeFileSync(path.join(chapterPath, "chapter.ts"), content, "utf-8");
	console.log(`Generated Chapter: chapters/${chapterDirName}`);
}
