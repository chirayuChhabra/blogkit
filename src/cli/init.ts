import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import { fileURLToPath } from "url";

function toSlug(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function toCamel(str: string): string {
	let varName = toSlug(str).replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
	if (/^[0-9]/.test(varName)) varName = `_${varName}`;
	return varName;
}

export async function runInit(args: string[]) {
	console.log("Welcome to Mr Markdown! Let's scaffold your new project.\n");

	const skipPrompts = args.includes("-y") || args.includes("--yes");

	let projectName = "my-md-project";
	let chapterTitle = "First Chapter";
	let lessonTitle = "First Lesson";

	if (!skipPrompts) {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		const rawProjectName = await rl.question("Project name (my-md-project): ");
		projectName = rawProjectName.trim() || projectName;

		const rawChapterTitle = await rl.question(
			"First chapter title (First Chapter): ",
		);
		chapterTitle = rawChapterTitle.trim() || chapterTitle;

		const rawLessonTitle = await rl.question(
			"First lesson title (First Lesson): ",
		);
		lessonTitle = rawLessonTitle.trim() || lessonTitle;

		rl.close();
	}

	console.log("\nInitializing md project structure...");

	const chapterSlug = toSlug(chapterTitle) || "chapter";
	const lessonSlug = toSlug(lessonTitle) || "lesson";

	const chapterVar = toCamel(chapterTitle) || "firstChapter";
	const lessonVar = toCamel(lessonTitle) || "firstLesson";

	const chapterDir = `01-${chapterSlug}`;
	const lessonDir = `01-${lessonSlug}`;

	const dirs = [
		"chapters",
		`chapters/${chapterDir}`,
		`chapters/${chapterDir}/lessons`,
		`chapters/${chapterDir}/lessons/${lessonDir}`,
		`chapters/${chapterDir}/lessons/${lessonDir}/sims`,
		`chapters/${chapterDir}/lessons/${lessonDir}/media`,
		`chapters/${chapterDir}/lessons/${lessonDir}/quizzes`,
		`chapters/${chapterDir}/lessons/${lessonDir}/content`,
	];

	for (const dir of dirs) {
		const fullPath = path.resolve(process.cwd(), dir);
		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath, { recursive: true });
			console.log(`  Created directory: ${dir}`);
		}
	}

	const chapterTsPath = path.resolve(
		process.cwd(),
		`chapters/${chapterDir}/chapter.ts`,
	);
	if (!fs.existsSync(chapterTsPath)) {
		fs.writeFileSync(
			chapterTsPath,
			`import { chapter, type ChapterBuilder } from "mr-md";
import { ${lessonVar} } from "./lessons/${lessonDir}/lesson.js";

export const ${chapterVar}: ChapterBuilder = chapter("${chapterTitle}", (ctx: ChapterBuilder) => {
	ctx.lesson(${lessonVar});
});

if (import.meta.main) {
	${chapterVar}.build();
}
`,
			"utf-8",
		);
		console.log(`  Created: chapters/${chapterDir}/chapter.ts`);
	}

	const lessonTsPath = path.resolve(
		process.cwd(),
		`chapters/${chapterDir}/lessons/${lessonDir}/lesson.ts`,
	);
	if (!fs.existsSync(lessonTsPath)) {
		fs.writeFileSync(
			lessonTsPath,
			`import { lesson, type LessonBuilder } from "mr-md";

export const ${lessonVar}: LessonBuilder = lesson("${lessonTitle}", { contentBase: import.meta.dir }, (ctx: LessonBuilder) => {
	ctx.markdown("Welcome to your first lesson!");
});
`,
			"utf-8",
		);
		console.log(
			`  Created: chapters/${chapterDir}/lessons/${lessonDir}/lesson.ts`,
		);
	}

	const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
	if (!fs.existsSync(tsconfigPath)) {
		fs.writeFileSync(
			tsconfigPath,
			`{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleDetection": "force"
  }
}
`,
			"utf-8",
		);
		console.log("  Created: tsconfig.json");
	}

	const packageJsonPath = path.resolve(process.cwd(), "package.json");
	let pkg: any = {};
	if (fs.existsSync(packageJsonPath)) {
		try {
			pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		} catch (_e) {
			console.error("  Failed to parse existing package.json, ignoring.");
		}
	} else {
		pkg = {
			name: projectName,
			version: "1.0.0",
			private: true,
		};
	}

	pkg.scripts = {
		...(pkg.scripts || {}),
		build: `bun chapters/${chapterDir}/chapter.ts`,
	};

	let mrMdVersion = "latest";
	try {
		// Find mr-md's own package.json to get its version
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const ownPkgPath = path.resolve(__dirname, "../../package.json");
		const ownPkg = JSON.parse(fs.readFileSync(ownPkgPath, "utf-8"));
		mrMdVersion = ownPkg.version;
	} catch (_e) {
		// Fallback if unable to read
	}

	pkg.dependencies = {
		...(pkg.dependencies || {}),
		"mr-md": mrMdVersion,
	};

	fs.writeFileSync(
		packageJsonPath,
		`${JSON.stringify(pkg, null, 2)}\n`,
		"utf-8",
	);
	console.log("  Updated: package.json");

	console.log(
		"\nDone! You can now run `bunx md dev` to start the local development server.",
	);
}
