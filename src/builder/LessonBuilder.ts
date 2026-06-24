import * as fs from "fs";
import * as path from "path";
import { logger } from "../cli/logger.js";
import { render } from "../renderer/index.js";
import type { BuildOptions, Lesson, LessonMeta } from "../types.js";
import { LessonBlocks } from "./LessonBlocks.js";
import { copyAssets, getCallerDir, mergeOptions } from "./utils.js";
import { validateLesson } from "./validation.js";

export class LessonBuilder extends LessonBlocks {
	private meta: LessonMeta;
	private options: BuildOptions;
	private _rawOptions: BuildOptions;

	constructor(title: string, options: BuildOptions = {}, callerDir?: string) {
		super();
		this._rawOptions = options;

		let slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
		if (!slug) slug = "lesson";

		this.meta = {
			title,
			slug,
		};
		this.options = mergeOptions(options, callerDir);
	}

	protected get contentBase(): string | undefined {
		return this.options.contentBase;
	}

	slug(slug: string): this {
		this.meta.slug = slug;
		return this;
	}

	description(text: string): this {
		this.meta.description = text;
		return this;
	}

	tags(...tags: string[]): this {
		this.meta.tags = tags;
		return this;
	}

	author(name: string): this {
		this.meta.author = name;
		return this;
	}

	status(status: "read" | "unread" | "locked"): this {
		this.meta.status = status;
		return this;
	}

	preset(preset: NonNullable<BuildOptions["preset"]>): this {
		this.options.preset = {
			layout: preset.layout ?? this.options.preset?.layout ?? "lesson",
			density: preset.density ?? this.options.preset?.density ?? "comfortable",
			tone: preset.tone ?? this.options.preset?.tone ?? "scholarly",
		};
		return this;
	}

	_inheritOptions(parentOpts: BuildOptions, parentRawOpts?: BuildOptions) {
		this.options = {
			outDir:
				this._rawOptions.outDir ??
				(parentRawOpts?.outDir || parentOpts.outDir) ??
				this.options.outDir,
			contentBase:
				this._rawOptions.contentBase ??
				parentRawOpts?.contentBase ??
				this.options.contentBase,
			theme: this._rawOptions.theme ?? parentOpts.theme ?? this.options.theme,
			palette:
				this._rawOptions.palette ?? parentOpts.palette ?? this.options.palette,
			strict:
				this._rawOptions.strict ?? parentOpts.strict ?? this.options.strict,
			standalone:
				this._rawOptions.standalone ??
				parentOpts.standalone ??
				this.options.standalone,
			preset: {
				...parentOpts.preset,
				...this._rawOptions.preset,
				...this.options.preset,
			},
		};
	}

	_setParentSlug(slug: string) {
		this.meta.parentSlug = slug;
	}

	_setPrev(slug: string, title: string) {
		this.meta.prevSlug = slug;
		this.meta.prevTitle = title;
	}

	_setNext(slug: string, title: string) {
		this.meta.nextSlug = slug;
		this.meta.nextTitle = title;
	}

	_getMeta(): LessonMeta {
		return this.meta;
	}

	toJSON(): Lesson {
		validateLesson(this.meta, this.blocks, this.options);
		return { meta: this.meta, blocks: this.blocks };
	}

	build(): string {
		validateLesson(this.meta, this.blocks, this.options);
		const lesson: Lesson = { meta: this.meta, blocks: this.blocks };
		const html = render(lesson, this.options);

		const outDir = path.resolve(this.options.outDir as string);
		const filename = this.meta.parentSlug
			? `${this.meta.slug}.html`
			: "index.html";
		const outPath = path.join(outDir, filename);
		const outPathDir = path.dirname(outPath);

		if (!fs.existsSync(outPathDir))
			fs.mkdirSync(outPathDir, { recursive: true });

		fs.writeFileSync(outPath, html, "utf-8");

		if (this.options.standalone === false) {
			copyAssets(outDir);
		}

		const relPath = path.relative(process.cwd(), outPath);
		logger.success(`Built lesson (${this.blocks.length} blocks) → ${relPath}`);
		return outPath;
	}
}

export function lesson(
	title: string,
	optionsOrSetup?: BuildOptions | ((ctx: LessonBuilder) => void),
	setup?: (ctx: LessonBuilder) => void,
): LessonBuilder {
	let options: BuildOptions = {};
	let cb: ((ctx: LessonBuilder) => void) | undefined = setup;

	if (typeof optionsOrSetup === "function") {
		cb = optionsOrSetup;
	} else if (optionsOrSetup) {
		options = optionsOrSetup;
	}

	const builder = new LessonBuilder(title, options, getCallerDir());
	if (cb) {
		cb(builder);
	}
	return builder;
}
