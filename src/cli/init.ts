import * as fs from "fs";
import * as path from "path";

export async function runInit() {
	console.log("Initializing md project structure...");

	const dirs = [
		"chapters",
		"chapters/01-chapter",
		"chapters/01-chapter/lessons",
		"chapters/01-chapter/lessons/01-lesson",
		"chapters/01-chapter/lessons/01-lesson/sims",
		"chapters/01-chapter/lessons/01-lesson/media",
		"chapters/01-chapter/lessons/01-lesson/quizzes",
		"chapters/01-chapter/lessons/01-lesson/content",
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

	const packageJsonPath = path.resolve(process.cwd(), "package.json");
	let pkg: any = {};
	if (fs.existsSync(packageJsonPath)) {
		try {
			pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		} catch (e) {
			console.error("  Failed to parse existing package.json, ignoring.");
		}
	} else {
		pkg = {
			name: "my-md-project",
			version: "1.0.0",
			private: true
		};
	}

	pkg.scripts = {
		...(pkg.scripts || {}),
		build: "bun chapters/01-chapter/chapter.ts",
		dev: "md dev",
		g: "md g",
		generate: "md generate"
	};

	let mrMdVersion = "latest";
	try {
		// Find mr-md's own package.json to get its version
		const __dirname = path.dirname(new URL(import.meta.url).pathname);
		const ownPkgPath = path.resolve(__dirname, "../../package.json");
		const ownPkg = JSON.parse(fs.readFileSync(ownPkgPath, "utf-8"));
		mrMdVersion = ownPkg.version;
	} catch (e) {
		// Fallback if unable to read
	}

	pkg.dependencies = {
		...(pkg.dependencies || {}),
		"mr-md": mrMdVersion
	};

	fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
	console.log("  Updated: package.json");

	console.log("\nDone! You can now run `npm run dev` or `bun run dev` to start the local development server.");
}
