// ─── Block Types ─────────────────────────────────────────────────────────────

export type BlockType =
	| "heading"
	| "markdown"
	| "section"
	| "important"
	| "note"
	| "warning"
	| "tip"
	| "simulation"
	| "animation"
	| "media"
	| "youtube"
	| "latex"
	| "columns"
	| "quiz"
	| "divider"
	| "code";

export interface BaseBlock {
	type: BlockType;
}

// Markdown content blocks
export interface HeadingBlock extends BaseBlock {
	type: "heading";
	src: string; // path to .md file or inline markdown
	title?: string; // override title extracted from md
}

export interface MarkdownBlock extends BaseBlock {
	type: "markdown";
	src: string; // path to .md file or inline markdown
}

export interface SectionBlock extends BaseBlock {
	type: "section";
	src: string; // path to .md file or inline markdown
	label?: string; // override sidebar label
}

export interface CalloutBlock extends BaseBlock {
	type: "important" | "warning" | "tip" | "note";
	src: string;
}

export interface CodeBlock extends BaseBlock {
	type: "code";
	src: string;
	lang?: string;
	label?: string;
}

export type BlockAccent =
	| "neutral"
	| "blue"
	| "teal"
	| "amber"
	| "rose"
	| "violet";

export interface CaptionedBlock {
	label?: string;
	caption?: string;
}

// Interactive blocks
export interface SimulationBlock extends BaseBlock, CaptionedBlock {
	type: "simulation";
	src: string; // path to .js file or inline JS
	props?: Record<string, unknown>; // passed to the sim as window.__simProps
	tunables?: Record<string, SimulationControl>;
	height?: number; // iframe height, default 400
	aspect?: "wide" | "standard" | "square";
	controls?: "interactive" | "observe";
	accent?: BlockAccent;
}

export interface AnimationBlock extends BaseBlock, CaptionedBlock {
	type: "animation";
	src: string; // path to .js file or inline JS
	loop?: boolean;
	height?: number;
	aspect?: "wide" | "standard" | "square";
	accent?: BlockAccent;
}

export type MediaKind = "image" | "video" | "audio";

export interface MediaBlock extends BaseBlock, CaptionedBlock {
	type: "media";
	src: string;
	kind: MediaKind;
	alt?: string;
	credit?: string;
	poster?: string;
	controls?: boolean;
	aspect?: "wide" | "standard" | "square" | "auto";
}

export interface YouTubeBlock extends BaseBlock, CaptionedBlock {
	type: "youtube";
	id: string;
	start?: number;
	aspect?: "wide" | "standard";
}

export interface LatexBlock extends BaseBlock, CaptionedBlock {
	type: "latex";
	tex: string;
	display?: boolean;
}

export interface ColumnItem {
	src?: string;
	markdown?: string;
	latex?: string;
	width?: string;
}

export interface ColumnsBlock extends BaseBlock, CaptionedBlock {
	type: "columns";
	columns: ColumnItem[];
}

export interface QuizBlock extends BaseBlock, CaptionedBlock {
	type: "quiz";
	src: string; // path to .json file or inline json
}

export interface DividerBlock extends BaseBlock {
	type: "divider";
}

export type Block =
	| HeadingBlock
	| MarkdownBlock
	| SectionBlock
	| CalloutBlock
	| CodeBlock
	| SimulationBlock
	| AnimationBlock
	| MediaBlock
	| YouTubeBlock
	| LatexBlock
	| ColumnsBlock
	| QuizBlock
	| DividerBlock;

// ─── Lesson Schema ────────────────────────────────────────────────────────────

export interface LessonMeta {
	title: string;
	slug: string;
	description?: string;
	tags?: string[];
	author?: string;
	status?: "read" | "unread" | "locked";
	parentSlug?: string;
}

export interface Lesson {
	meta: LessonMeta;
	blocks: Block[];
}

export interface LessonPreset {
	layout?: "lesson" | "article" | "lab";
	density?: "comfortable" | "compact";
	tone?: "scholarly" | "studio" | "minimal";
}

// ─── Quiz Schema (for .json files) ───────────────────────────────────────────

export interface QuizQuestion {
	q: string;
	options: string[];
	answer: number; // index of correct option
	explanation?: string;
}

export interface QuizFile {
	questions: QuizQuestion[];
}

// ─── Build Options ────────────────────────────────────────────────────────────

export interface BuildOptions {
	outDir?: string; // default: './out'
	contentBase?: string; // base path for resolving .md / .js / .json files
	theme?: "light" | "dark" | "auto";
	palette?: "ink" | "field" | "ember";
	font?: string; // custom font family
	favicon?: string;
	head?: string; // custom HTML to inject into <head>
	preset?: LessonPreset;
	strict?: boolean; // default: true. Throws on missing files and invalid production blocks.
}

export interface SimulationOptions {
	props?: Record<string, unknown>;
	tunables?: Record<string, SimulationControl>;
	height?: number;
	aspect?: SimulationBlock["aspect"];
	label?: string;
	caption?: string;
	controls?: SimulationBlock["controls"];
	accent?: BlockAccent;
}

export interface SimulationControl {
	label?: string;
	min?: number;
	max?: number;
	step?: number;
}

export interface AnimationOptions {
	loop?: boolean;
	height?: number;
	aspect?: AnimationBlock["aspect"];
	label?: string;
	caption?: string;
	accent?: BlockAccent;
}

export interface MediaOptions {
	kind?: MediaKind;
	alt?: string;
	label?: string;
	caption?: string;
	credit?: string;
	poster?: string;
	controls?: boolean;
	aspect?: MediaBlock["aspect"];
}

export interface YouTubeOptions {
	start?: number;
	label?: string;
	caption?: string;
	aspect?: YouTubeBlock["aspect"];
}

export interface LatexOptions {
	display?: boolean;
	label?: string;
	caption?: string;
}

export interface ColumnsOptions {
	label?: string;
	caption?: string;
}

// ─── Chapter Schema ──────────────────────────────────────────────────────────

export interface ChapterMeta {
	title: string;
	slug: string;
	description?: string;
}

export interface Chapter {
	meta: ChapterMeta;
	lessons: Lesson[];
}
