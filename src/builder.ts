import * as fs from "fs";
import * as path from "path";
import { render, renderChapter } from "./renderer/index.js";
import type {
	AnimationBlock,
	AnimationOptions,
	Block,
	BuildOptions,
	CalloutBlock,
	Chapter,
	ChapterMeta,
	CodeBlock,
	ColumnItem,
	ColumnsBlock,
	ColumnsOptions,
	DividerBlock,
	HeadingBlock,
	LatexBlock,
	LatexOptions,
	Lesson,
	LessonMeta,
	MarkdownBlock,
	MediaBlock,
	MediaOptions,
	QuizBlock,
	SectionBlock,
	SimulationBlock,
	SimulationConfig,
	SimulationOptions,
	YouTubeBlock,
	YouTubeOptions,
} from "./types.js";

function getCallerDir(): string | undefined {
	const err = new Error();
	const stack = err.stack?.split("\n");
	if (!stack || stack.length < 2) return undefined;

	let builderFilePath: string | undefined;

	for (let i = 1; i < stack.length; i++) {
		const line = stack[i];
		const match = line.match(/\((.*?):\d+:\d+\)/) || line.match(/at (.*?):\d+:\d+/);
		if (match) {
			let p = match[1];
			if (p.startsWith("file://")) {
				p = p.replace(/^file:\/\//, "");
			}
			if (p.startsWith("/") && p[2] === ":") {
				p = p.substring(1); // Handle Windows paths like /C:/
			}
			
			if (!builderFilePath) {
				builderFilePath = p;
				continue;
			}
			
			if (p === builderFilePath) {
				continue;
			}
			
			return path.dirname(p);
		}
	}
	return undefined;
}

// ─── LessonBuilder ────────────────────────────────────────────────────────────

export class LessonBuilder {
	private meta: LessonMeta;
	private blocks: Block[] = [];
	private options: BuildOptions;
	private _rawOptions: BuildOptions;

	constructor(title: string, options: BuildOptions = {}, callerDir?: string) {
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
		this.options = {
			outDir: options.outDir ?? (callerDir ? path.join(callerDir, "out") : "./out"),
			contentBase: options.contentBase ?? callerDir ?? ".",
			theme: options.theme ?? "light",
			palette: options.palette ?? "ink",
			strict: options.strict ?? true,
			preset: {
				layout: "lesson",
				density: "comfortable",
				tone: "scholarly",
				...options.preset,
			},
			...options,
		};
	}

	// ── Meta setters ────────────────────────────────────────────────────────────

	/**
	 * Sets the URL slug for the generated HTML file.
	 * Automatically generated from the title by default.
	 */
	slug(slug: string): this {
		this.meta.slug = slug;
		return this;
	}

	/**
	 * Sets the SEO meta description and subheading for the lesson.
	 */
	description(text: string): this {
		this.meta.description = text;
		return this;
	}

	/** Assigns taxonomy tags to the lesson. */
	tags(...tags: string[]): this {
		this.meta.tags = tags;
		return this;
	}

	/** Sets the author name for this lesson. */
	author(name: string): this {
		this.meta.author = name;
		return this;
	}

	/**
	 * Sets the progression status of the lesson.
	 * Used to visually distinguish read/unread/locked lessons in Chapter timelines.
	 */
	status(status: "read" | "unread" | "locked"): this {
		this.meta.status = status;
		return this;
	}

	/** Curated production defaults for the generated lesson shell. */
	preset(preset: NonNullable<BuildOptions["preset"]>): this {
		this.options.preset = {
			layout: preset.layout ?? this.options.preset?.layout ?? "lesson",
			density: preset.density ?? this.options.preset?.density ?? "comfortable",
			tone: preset.tone ?? this.options.preset?.tone ?? "scholarly",
		};
		return this;
	}

	/** @internal Used by ChapterBuilder to push down shared config */
	_inheritOptions(parentOpts: BuildOptions, parentRawOpts?: BuildOptions) {
		this.options = {
			outDir:
				this._rawOptions.outDir ?? (parentRawOpts?.outDir || parentOpts.outDir) ?? this.options.outDir,
			contentBase:
				this._rawOptions.contentBase ??
				parentRawOpts?.contentBase ??
				this.options.contentBase,
			theme: this._rawOptions.theme ?? parentOpts.theme ?? this.options.theme,
			palette:
				this._rawOptions.palette ?? parentOpts.palette ?? this.options.palette,
			strict:
				this._rawOptions.strict ?? parentOpts.strict ?? this.options.strict,
			preset: {
				...parentOpts.preset,
				...this._rawOptions.preset,
				...this.options.preset,
			},
		};
	}

	/** @internal Used by ChapterBuilder */
	_setParentSlug(slug: string) {
		this.meta.parentSlug = slug;
	}

	/** @internal Used by ChapterBuilder */
	_setPrev(slug: string, title: string) {
		this.meta.prevSlug = slug;
		this.meta.prevTitle = title;
	}

	/** @internal Used by ChapterBuilder */
	_setNext(slug: string, title: string) {
		this.meta.nextSlug = slug;
		this.meta.nextTitle = title;
	}

	/** @internal Used by ChapterBuilder */
	_getMeta(): LessonMeta {
		return this.meta;
	}

	// ── Content blocks ───────────────────────────────────────────────────────────

	/**
	 * Smart helper that automatically infers the correct block type from the file extension or URL.
	 * Allows authors to quickly sequence a lesson without memorizing specific block methods.
	 */
	add(src: `${string}.md` | `${string}.mdx`): this;
	add(src: `${string}.json`, opts?: Pick<QuizBlock, "label" | "caption">): this;
	add(
		src: `${string}.mp4` | `${string}.webm` | `${string}.mov`,
		opts?: Omit<MediaOptions, "kind">,
	): this;
	add(
		src: `${string}.mp3` | `${string}.wav` | `${string}.ogg` | `${string}.m4a`,
		opts?: Omit<MediaOptions, "kind">,
	): this;
	add(
		src:
			| `${string}.png`
			| `${string}.jpg`
			| `${string}.jpeg`
			| `${string}.gif`
			| `${string}.svg`
			| `${string}.webp`
			| `${string}.avif`,
		opts?: Omit<MediaOptions, "kind">,
	): this;
	// biome-ignore lint/suspicious/noExplicitAny: Overload signature
	add(src: string, opts?: any): this;
	// biome-ignore lint/suspicious/noExplicitAny: Overload implementation
	add(src: string, opts: any = {}): this {
		const lower = src.toLowerCase();
		if (lower.endsWith(".md") || lower.endsWith(".mdx"))
			return this.markdown(src);
		if (lower.endsWith(".json")) return this.quiz(src, opts);
		
		if (lower.endsWith(".js") || lower.endsWith(".ts")) {
			throw new Error(
				`Ambiguous use of .add("${src}"). ` +
				`Please use .code("${src}") to display the source code, ` +
				`or .lab("${src}") to mount it as an interactive simulation.`
			);
		}

		if (lower.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/))
			return this.image(src, opts);
		if (lower.match(/\.(mp4|webm|mov)$/)) return this.video(src, opts);
		if (lower.match(/\.(mp3|wav|ogg|m4a)$/)) return this.audio(src, opts);
		if (lower.includes("youtube.com") || lower.includes("youtu.be"))
			return this.youtube(src, opts);

		// Fallback to text/markdown if unknown
		return this.markdown(src);
	}

	/**
	 * Creates a major chapter heading (H2) and a top-level sidebar navigation entry.
	 * @param src Path to a markdown file or raw markdown string.
	 * @param title Optional title override for the sidebar and heading.
	 * @example lesson.heading("# Welcome to Physics")
	 */
	heading(src: string, title?: string): this {
		this.blocks.push({ type: "heading", src, title } as HeadingBlock);
		return this;
	}

	/**
	 * Adds standard markdown prose into the current section.
	 * @param src Path to a markdown file or raw markdown string.
	 * @example lesson.markdown("This is a **bold** statement.")
	 */
	markdown(src: string): this {
		this.blocks.push({ type: "markdown", src } as MarkdownBlock);
		return this;
	}

	/** 
	 * Alias for `markdown()`. Keeps authoring readable in long lessons.
	 * @example lesson.content("content/intro.md")
	 */
	content(src: string): this {
		return this.markdown(src);
	}

	/**
	 * Creates a new subsection heading (H3) and a sub-entry in the sidebar.
	 * @param src Path to a markdown file or raw markdown string.
	 * @param label Optional title override for the sidebar label.
	 * @example lesson.section("### 1. Kinematics")
	 */
	section(src: string, label?: string): this {
		this.blocks.push({ type: "section", src, label } as SectionBlock);
		return this;
	}

	/** 
	 * Adds an 'Important' highlighted callout.
	 * @example lesson.important("Do not touch the exposed wire.")
	 */
	important(src: string): this {
		this.blocks.push({ type: "important", src } as CalloutBlock);
		return this;
	}

	/** 
	 * Adds a 'Warning' highlighted callout.
	 * @example lesson.warning("This is deprecated.")
	 */
	warning(src: string): this {
		this.blocks.push({ type: "warning", src } as CalloutBlock);
		return this;
	}

	/** 
	 * Adds a 'Tip' highlighted callout.
	 */
	tip(src: string): this {
		this.blocks.push({ type: "tip", src } as CalloutBlock);
		return this;
	}

	/** 
	 * Adds a 'Note' highlighted callout.
	 */
	note(src: string): this {
		this.blocks.push({ type: "note", src } as CalloutBlock);
		return this;
	}

	callout(type: CalloutBlock["type"], src: string): this {
		this.blocks.push({ type, src } as CalloutBlock);
		return this;
	}

	/**
	 * Adds a syntax-highlighted code block.
	 * @param src Path to a code file or raw code string.
	 * @param lang Explicit language for highlighting (e.g. "ts", "python").
	 * @param label Optional file name or label to display above the code block.
	 */
	code(src: string, lang?: string, label?: string): this {
		this.blocks.push({ type: "code", src, lang, label } as CodeBlock);
		return this;
	}

	latex(tex: string, opts: LatexOptions = {}): this {
		this.blocks.push({
			type: "latex",
			tex,
			display: opts.display ?? true,
			label: opts.label,
			caption: opts.caption,
		} as LatexBlock);
		return this;
	}

	columns(columns: ColumnItem[], opts: ColumnsOptions = {}): this {
		this.blocks.push({ type: "columns", columns, ...opts } as ColumnsBlock);
		return this;
	}

	// ── Interactive blocks ───────────────────────────────────────────────────────

	private loadSimulationConfig(src: string): SimulationConfig | null {
		try {
			const base = this.options.contentBase ?? process.cwd();
			const resolved = path.resolve(base, src);
			const ext = path.extname(resolved);
			const configPath = `${resolved.slice(0, -ext.length)}.config.json`;
			if (fs.existsSync(configPath)) {
				return JSON.parse(fs.readFileSync(configPath, "utf-8"));
			}
		} catch {
			// ignore
		}
		return null;
	}

	/**
	 * Mounts a sandboxed JavaScript simulation or interactive applet.
	 * @param src Path to the JavaScript simulation code.
	 * @param opts Configuration options including tunables, height, and aspect ratio.
	 * @param height Optional fixed iframe height in pixels.
	 * @example lesson.simulation("sims/pendulum.js", { height: 500 })
	 */
	simulation(
		src: string,
		opts: SimulationOptions | Record<string, unknown> = {},
		height = 420,
	): this {
		const fileConfig = this.loadSimulationConfig(src);
		const normalized = normalizeSimulationOptions(opts, height, fileConfig);
		this.blocks.push({
			type: "simulation",
			src,
			dependencies: fileConfig?.dependencies,
			...normalized,
		} as SimulationBlock);
		return this;
	}

	/**
	 * Opinionated alias for `simulation()`, configured specifically for interactive physics/math labs.
	 * Sets the default interaction mode to fully interactive.
	 * @param src Path to the JavaScript simulation code.
	 * @param opts Configuration options.
	 * @example lesson.lab("sims/optics-lab.js")
	 */
	lab(src: string, opts: SimulationOptions = {}): this {
		return this.simulation(src, { controls: "interactive", ...opts });
	}

	/** Passive animation player */
	animation(src: string, opts: AnimationOptions = {}): this {
		this.blocks.push({
			type: "animation",
			src,
			loop: opts.loop ?? true,
			height: opts.height ?? 360,
			label: opts.label,
			caption: opts.caption,
			accent: opts.accent ?? "neutral",
		} as AnimationBlock);
		return this;
	}

	media(src: string, opts: MediaOptions = {}): this {
		this.blocks.push({
			type: "media",
			src,
			kind: opts.kind ?? inferMediaKind(src),
			alt: opts.alt,
			label: opts.label,
			caption: opts.caption,
			credit: opts.credit,
			poster: opts.poster,
			controls: opts.controls ?? true,
		} as MediaBlock);
		return this;
	}

	image(src: string, opts: Omit<MediaOptions, "kind"> = {}): this {
		return this.media(src, { ...opts, kind: "image" });
	}

	video(src: string, opts: Omit<MediaOptions, "kind"> = {}): this {
		return this.media(src, { ...opts, kind: "video" });
	}

	youtube(idOrUrl: string, opts: YouTubeOptions = {}): this {
		this.blocks.push({
			type: "youtube",
			id: extractYouTubeId(idOrUrl),
			start: opts.start,
			label: opts.label,
			caption: opts.caption,
		} as YouTubeBlock);
		return this;
	}

	audio(src: string, opts: Omit<MediaOptions, "kind"> = {}): this {
		return this.media(src, { ...opts, kind: "audio" });
	}

	/**
	 * Injects an interactive multiple-choice quiz block.
	 * @param src Path to a .json file conforming to the `QuizFile` schema.
	 * @param opts Optional label and caption for the quiz block wrapper.
	 */
	quiz(src: string, opts: Pick<QuizBlock, "label" | "caption"> = {}): this {
		this.blocks.push({ type: "quiz", src, ...opts } as QuizBlock);
		return this;
	}

	/** Visual separator */
	divider(): this {
		this.blocks.push({ type: "divider" } as DividerBlock);
		return this;
	}

	// ── Output ───────────────────────────────────────────────────────────────────

	/** Returns the raw Lesson object (useful for testing or custom rendering) */
	toJSON(): Lesson {
		validateLesson(this.meta, this.blocks, this.options);
		return { meta: this.meta, blocks: this.blocks };
	}

	/** Compiles everything and writes a single .html file to outDir */
	build(): string {
		validateLesson(this.meta, this.blocks, this.options);
		const lesson: Lesson = { meta: this.meta, blocks: this.blocks };
		const html = render(lesson, this.options);

		const outDir = path.resolve(this.options.outDir as string);
		if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

		const outPath = path.join(outDir, `${this.meta.slug}.html`);
		fs.writeFileSync(outPath, html, "utf-8");

		const relPath = path.relative(process.cwd(), outPath);
		console.log(`  ✓ Built lesson (${this.blocks.length} blocks) → ${relPath}`);
		return outPath;
	}
}

// ─── Factory function (the public API) ───────────────────────────────────────

/**
 * Starts building a new interactive lesson.
 * @param title The display title for the lesson.
 * @param options Build configuration for this specific lesson.
 * @example const l = lesson("Introduction to Kinematics").markdown("intro.md");
 */
export function lesson(
	title: string,
	options: BuildOptions = {},
): LessonBuilder {
	return new LessonBuilder(title, options, getCallerDir());
}

function normalizeSimulationOptions(
	opts: SimulationOptions | Record<string, unknown>,
	legacyHeight: number,
	fileConfig: SimulationConfig | null = null,
): SimulationOptions {
	let inline: SimulationOptions;
	const optionKeys = [
		"props",
		"tunables",
		"height",
		"label",
		"caption",
		"controls",
		"accent",
	];
	const looksLikeOptions = Object.keys(opts).every((key) =>
		optionKeys.includes(key),
	);

	if (!looksLikeOptions) {
		inline = { props: opts as Record<string, unknown> };
	} else {
		inline = opts as SimulationOptions;
	}

	return {
		props: { ...(fileConfig?.props ?? {}), ...(inline.props ?? {}) },
		tunables: inline.tunables ?? fileConfig?.tunables,
		height: inline.height ?? fileConfig?.height ?? legacyHeight,
		label: inline.label ?? fileConfig?.label,
		caption: inline.caption ?? fileConfig?.caption,
		controls: inline.controls ?? fileConfig?.controls ?? "interactive",
		accent: inline.accent ?? fileConfig?.accent ?? "blue",
	};
}

function inferMediaKind(src: string): MediaBlock["kind"] {
	const ext = path.extname(src).toLowerCase();
	if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
	if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) return "audio";
	return "image"; // .gif, .svg, .webp, .avif, .jpg, .png
}

function extractYouTubeId(idOrUrl: string): string {
	const watch = idOrUrl.match(/[?&]v=([^&]+)/);
	if (watch) return watch[1];

	const short = idOrUrl.match(/youtu\.be\/([^?&/]+)/);
	if (short) return short[1];

	const embed = idOrUrl.match(/youtube\.com\/embed\/([^?&/]+)/);
	if (embed) return embed[1];

	const shorts = idOrUrl.match(/youtube\.com\/shorts\/([^?&/]+)/);
	if (shorts) return shorts[1];

	return idOrUrl;
}

function validateLesson(
	meta: LessonMeta,
	blocks: Block[],
	options: BuildOptions,
): void {
	if (options.strict === false) return;

	const errors: string[] = [];

	if (!meta.title.trim()) errors.push("Lesson title is required.");
	if (!meta.slug.trim()) errors.push("Lesson slug is required.");
	if (!blocks.length) errors.push("Lesson needs at least one block.");

	blocks.forEach((block, index) => {
		if (
			"height" in block &&
			typeof block.height === "number" &&
			block.height < 240
		) {
			errors.push(
				`${block.type} block ${index + 1} should be at least 240px tall.`,
			);
		}

		if (
			block.type === "media" &&
			block.kind === "image" &&
			!block.alt?.trim()
		) {
			errors.push(`Image media block ${index + 1} needs alt text.`);
		}

		if (
			block.type === "simulation" &&
			block.controls === "observe" &&
			block.caption == null
		) {
			errors.push(
				`Observe-only simulation block ${index + 1} needs a caption.`,
			);
		}
	});

	if (errors.length) {
		throw new Error(
			`Mr Markdown production checks failed:\n- ${errors.join("\n- ")}`,
		);
	}
}

// ─── ChapterBuilder ──────────────────────────────────────────────────────────

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
		this.options = {
			outDir: options.outDir ?? (callerDir ? path.join(callerDir, "out") : "./out"),
			contentBase: options.contentBase ?? callerDir ?? ".",
			theme: options.theme ?? "light",
			palette: options.palette ?? "ink",
			strict: options.strict ?? true,
			preset: {
				layout: "lesson",
				density: "comfortable",
				tone: "scholarly",
				...options.preset,
			},
			...options,
		};
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
		if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

		const outPath = path.join(outDir, `${this.meta.slug}.html`);
		fs.writeFileSync(outPath, html, "utf-8");

		const relPath = path.relative(process.cwd(), outPath);
		console.log(
			`  ✓ Built chapter (${this.lessonBuilders.length} lessons) → ${relPath}`,
		);
		return outPath;
	}

	/** Returns the raw Chapter object */
	toJSON(): Chapter {
		const lessons: Lesson[] = [];
		for (const lb of this.lessonBuilders) {
			lessons.push(lb.toJSON());
		}
		return { meta: this.meta, lessons };
	}
}

/**
 * Starts building a new chapter that groups multiple lessons together.
 * @param title The display title for the chapter.
 * @param options Shared build configuration that cascades to all child lessons.
 * @example 
 * chapter("Mechanics")
 *   .lesson(kinematicsLesson)
 *   .lesson(dynamicsLesson)
 *   .build();
 */
export function chapter(
	title: string,
	options: BuildOptions = {},
): ChapterBuilder {
	return new ChapterBuilder(title, options, getCallerDir());
}
