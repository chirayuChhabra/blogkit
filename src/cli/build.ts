import { createRequire } from "module";
const require = createRequire(import.meta.url);
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { logger } from "./logger.js";

function buildFile(filePath: string) {
	logger.startSpinner(`Building file: ${filePath}`);
	const outDir = path.resolve(process.cwd(), path.dirname(filePath), "out");
	const contentBase = path.dirname(filePath);

	try {
		const {
			parseChapter,
			parseLesson,
			buildChapter,
			buildLesson,
		} = require("../parser/mdx.js");
		const content = fs.readFileSync(filePath, "utf-8");
		const parsed = matter(content);
		
		const isChapter = parsed.data.chapter === true || parsed.data.type === "chapter";

		if (isChapter) {
			const chapter = parseChapter(content, { outDir, contentBase }, contentBase);
			buildChapter(chapter, { outDir, contentBase });
		} else {
			const lesson = parseLesson(content, { outDir, contentBase }, contentBase);
			buildLesson(lesson, { outDir, contentBase });
		}
		logger.succeedSpinner(`Build successful for ${filePath}.`);
	} catch (err: any) {
		logger.failSpinner(`Build failed for ${filePath}`);
		logger.error(`Error details:`, err);
		process.exit(1);
	}
}

export function runBuild(args: string[]) {
	process.env.NODE_ENV = "production";
	const target = args[0];

	if (!target) {
		// Build all chapters in `chapters/` directory
		const chaptersDir = path.join(process.cwd(), "chapters");
		if (fs.existsSync(chaptersDir)) {
			const dirs = fs.readdirSync(chaptersDir, { withFileTypes: true });
			let foundAny = false;
			for (const dir of dirs) {
				if (dir.isDirectory()) {
					const chapterFile = path.join(chaptersDir, dir.name, "chapter.md");
					if (fs.existsSync(chapterFile)) {
						buildFile(chapterFile);
						foundAny = true;
					}
				}
			}
			if (!foundAny) {
				logger.error("No chapter files found inside chapters/ directory.");
				process.exit(1);
			}
		} else {
			logger.error("No chapters/ directory found. Run mr-md build . to build current directory.");
			process.exit(1);
		}
	} else if (target === ".") {
		// Build current directory
		const cwd = process.cwd();
		const possibleFiles = ["chapter.md", "lesson.md", "index.md"];
		let found = false;
		for (const file of possibleFiles) {
			const filePath = path.join(cwd, file);
			if (fs.existsSync(filePath)) {
				buildFile(filePath);
				found = true;
				break;
			}
		}
		if (!found) {
			logger.error("No chapter.md or lesson.md found in current directory.");
			process.exit(1);
		}
	} else {
		// Build specific file or directory
		const targetPath = path.resolve(process.cwd(), target);
		if (fs.existsSync(targetPath)) {
			if (fs.statSync(targetPath).isDirectory()) {
				let found = false;
				for (const file of ["chapter.md", "lesson.md", "index.md"]) {
					const p = path.join(targetPath, file);
					if (fs.existsSync(p)) {
						buildFile(p);
						found = true;
						break;
					}
				}
				if (!found) {
					logger.error(`No chapter.md or lesson.md found in directory: ${targetPath}`);
					process.exit(1);
				}
			} else {
				if (!targetPath.endsWith(".md")) {
					logger.error("Unsupported file type. Must be a .md file.");
					process.exit(1);
				}
				buildFile(targetPath);
			}
		} else {
			logger.error(`File or directory not found: ${target}`);
			process.exit(1);
		}
	}
}
