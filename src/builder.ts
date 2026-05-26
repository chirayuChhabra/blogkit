import * as fs from "fs";
import * as path from "path";
import {
  Lesson,
  LessonMeta,
  Block,
  BuildOptions,
  ChapterBlock,
  MarkdownBlock,
  SectionBlock,
  CalloutBlock,
  CodeBlock,
  SimulationBlock,
  AnimationBlock,
  MediaBlock,
  YouTubeBlock,
  LatexBlock,
  ColumnsBlock,
  ColumnItem,
  QuizBlock,
  DividerBlock,
  SimulationOptions,
  AnimationOptions,
  MediaOptions,
  YouTubeOptions,
  LatexOptions,
  ColumnsOptions,
} from "./types";
import { render } from "./renderer";

// ─── LessonBuilder ────────────────────────────────────────────────────────────

export class LessonBuilder {
  private meta: LessonMeta;
  private blocks: Block[] = [];
  private options: BuildOptions;

  constructor(title: string, options: BuildOptions = {}) {
    this.meta = {
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    };
    this.options = {
      outDir: options.outDir ?? "./out",
      contentBase: options.contentBase ?? ".",
      theme: options.theme ?? "auto",
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

  /** Curated production defaults for the generated lesson shell. */
  preset(preset: NonNullable<BuildOptions["preset"]>): this {
    this.options.preset = {
      layout: preset.layout ?? this.options.preset?.layout ?? "lesson",
      density: preset.density ?? this.options.preset?.density ?? "comfortable",
      tone: preset.tone ?? this.options.preset?.tone ?? "scholarly",
    };
    return this;
  }

  // ── Content blocks ───────────────────────────────────────────────────────────

  /** Main heading section — becomes a sidebar entry with H2 */
  chapter(src: string, title?: string): this {
    this.blocks.push({ type: "chapter", src, title } as ChapterBlock);
    return this;
  }

  /** Continue prose in the SAME section — no new sidebar entry */
  markdown(src: string): this {
    this.blocks.push({ type: "markdown", src } as MarkdownBlock);
    return this;
  }

  /** Alias for prose. Keeps authoring readable in long lessons. */
  content(src: string): this {
    return this.markdown(src);
  }

  /** New subsection — H3 + new sidebar entry */
  section(src: string, label?: string): this {
    this.blocks.push({ type: "section", src, label } as SectionBlock);
    return this;
  }

  /** Highlighted callouts */
  important(src: string): this {
    this.blocks.push({ type: "important", src } as CalloutBlock);
    return this;
  }

  warning(src: string): this {
    this.blocks.push({ type: "warning", src } as CalloutBlock);
    return this;
  }

  tip(src: string): this {
    this.blocks.push({ type: "tip", src } as CalloutBlock);
    return this;
  }

  note(src: string): this {
    this.blocks.push({ type: "note", src } as CalloutBlock);
    return this;
  }

  callout(type: CalloutBlock["type"], src: string): this {
    this.blocks.push({ type, src } as CalloutBlock);
    return this;
  }

  /** Syntax-highlighted code block */
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

  private loadSimulationConfig(src: string): SimulationOptions | null {
    try {
      const base = this.options.contentBase ?? process.cwd();
      const resolved = path.resolve(base, src);
      const ext = path.extname(resolved);
      const configPath = resolved.slice(0, -ext.length) + ".config.json";
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
    } catch {
      // ignore
    }
    return null;
  }

  /** Sandboxed interactive simulation */
  simulation(
    src: string,
    opts: SimulationOptions | Record<string, unknown> = {},
    height = 420,
  ): this {
    const fileConfig = this.loadSimulationConfig(src);
    const normalized = normalizeSimulationOptions(opts, height, fileConfig);
    this.blocks.push({ type: "simulation", src, ...normalized } as SimulationBlock);
    return this;
  }

  /** Opinionated alias for interactive experiments. */
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
      aspect: opts.aspect ?? "wide",
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
      aspect: opts.aspect ?? "auto",
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
      aspect: opts.aspect ?? "wide",
    } as YouTubeBlock);
    return this;
  }

  audio(src: string, opts: Omit<MediaOptions, "kind" | "aspect"> = {}): this {
    return this.media(src, { ...opts, kind: "audio", aspect: "auto" });
  }

  /** Quiz block from .json */
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

    const outDir = path.resolve(this.options.outDir!);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, `${this.meta.slug}.html`);
    fs.writeFileSync(outPath, html, "utf-8");

    console.log(`✓ Built → ${outPath}`);
    return outPath;
  }
}

// ─── Factory function (the public API) ───────────────────────────────────────

export function lesson(title: string, options: BuildOptions = {}): LessonBuilder {
  return new LessonBuilder(title, options);
}

function normalizeSimulationOptions(
  opts: SimulationOptions | Record<string, unknown>,
  legacyHeight: number,
  fileConfig: SimulationOptions | null = null
): SimulationOptions {
  let inline: SimulationOptions;
  const optionKeys = ["props", "tunables", "height", "aspect", "label", "caption", "controls", "accent"];
  const looksLikeOptions = Object.keys(opts).some((key) => optionKeys.includes(key));

  if (!looksLikeOptions) {
    inline = { props: opts as Record<string, unknown> };
  } else {
    inline = opts as SimulationOptions;
  }

  return {
    props: { ...(fileConfig?.props ?? {}), ...(inline.props ?? {}) },
    tunables: inline.tunables ?? fileConfig?.tunables,
    height: inline.height ?? fileConfig?.height ?? legacyHeight,
    aspect: inline.aspect ?? fileConfig?.aspect ?? "wide",
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

function validateLesson(meta: LessonMeta, blocks: Block[], options: BuildOptions): void {
  if (options.strict === false) return;

  const errors: string[] = [];

  if (!meta.title.trim()) errors.push("Lesson title is required.");
  if (!meta.slug.trim()) errors.push("Lesson slug is required.");
  if (!blocks.length) errors.push("Lesson needs at least one block.");

  blocks.forEach((block, index) => {
    if ("height" in block && typeof block.height === "number" && block.height < 240) {
      errors.push(`${block.type} block ${index + 1} should be at least 240px tall.`);
    }

    if (block.type === "media" && block.kind === "image" && !block.alt?.trim()) {
      errors.push(`Image media block ${index + 1} needs alt text.`);
    }

    if (block.type === "simulation" && block.controls === "observe" && block.caption == null) {
      errors.push(`Observe-only simulation block ${index + 1} needs a caption.`);
    }
  });

  if (errors.length) {
    throw new Error(`Blogkit production checks failed:\n- ${errors.join("\n- ")}`);
  }
}
