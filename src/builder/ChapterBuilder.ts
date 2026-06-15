import * as fs from "fs";
import * as path from "path";
import { renderChapter } from "../renderer/index.js";
import type { BuildOptions, Chapter, ChapterMeta, Lesson } from "../types.js";
import type { LessonBuilder } from "./LessonBuilder.js";
import { copyAssets, getCallerDir, mergeOptions } from "./utils.js";

export class ChapterBuilder {
	private meta: ChapterMeta;
	private lessonBuilders: LessonBuilder[] = [];
	private options: BuildOptions;
	private _rawOptions: BuildOptions;

	constructor(title: string, options: BuildOptions = {}, callerDir?: string) {
		this._rawOptions = options;
		let slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
		if (!slug) slug = "chapter";

		this.meta = {
			title,
			slug,
		};
		this.options = mergeOptions(options, callerDir);
	}

	slug(slug: string): this {
		this.meta.slug = slug;
		return this;
	}

	description(text: string): this {
		this.meta.description = text;
		return this;
	}

	status(status: "completed" | "active" | "locked"): this {
		this.meta.status = status;
		return this;
	}

	lesson(lessonBuilder: LessonBuilder): this {
		lessonBuilder._inheritOptions(this.options, this._rawOptions);
		lessonBuilder._setParentSlug(this.meta.slug);
		this.lessonBuilders.push(lessonBuilder);
		return this;
	}

	build(): string {
		for (let i = 0; i < this.lessonBuilders.length; i++) {
			const lb = this.lessonBuilders[i];
			const currentMeta = lb._getMeta();
			if (i > 0 && !currentMeta.prevSlug) {
				const prev = this.lessonBuilders[i - 1]._getMeta();
				lb._setPrev(prev.slug, prev.title);
			}
			if (i < this.lessonBuilders.length - 1 && !currentMeta.nextSlug) {
				const next = this.lessonBuilders[i + 1]._getMeta();
				lb._setNext(next.slug, next.title);
			}
		}

		// Build all nested lessons first
		const lessons: Lesson[] = [];
		for (const lb of this.lessonBuilders) {
			// We build it to write out the HTML file
			lb.build();
			// We also collect the JSON data to render the chapter index
			lessons.push(lb.toJSON());
		}

		const chapterData: Chapter = { meta: this.meta, lessons };
		const html = renderChapter(chapterData, this.options);

		const outDir = path.resolve(this.options.outDir as string);
		const outPath = path.join(outDir, "index.html");
		const outPathDir = path.dirname(outPath);

		if (!fs.existsSync(outPathDir))
			fs.mkdirSync(outPathDir, { recursive: true });

		fs.writeFileSync(outPath, html, "utf-8");

		if (this.options.standalone === false) {
			copyAssets(outDir);
		}

		const relPath = path.relative(process.cwd(), outPath);
		console.log(
			`  ✓ Built chapter (${this.lessonBuilders.length} lessons) → ${relPath}`,
		);
		return outPath;
	}

	toJSON(): Chapter {
		const lessons: Lesson[] = [];
		for (const lb of this.lessonBuilders) {
			lessons.push(lb.toJSON());
		}
		return { meta: this.meta, lessons };
	}
}

export function chapter(
	title: string,
	optionsOrSetup?: BuildOptions | ((ctx: ChapterBuilder) => void),
	setup?: (ctx: ChapterBuilder) => void,
): ChapterBuilder {
	let options: BuildOptions = {};
	let cb: ((ctx: ChapterBuilder) => void) | undefined = setup;

	if (typeof optionsOrSetup === "function") {
		cb = optionsOrSetup;
	} else if (optionsOrSetup) {
		options = optionsOrSetup;
	}

	const builder = new ChapterBuilder(title, options, getCallerDir());
	if (cb) {
		cb(builder);
	}
	return builder;
}
