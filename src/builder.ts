import * as fs from 'fs'
import * as path from 'path'
import {
  Lesson, LessonMeta, Block, BuildOptions,
  HeadBlock, AddBlock, SubheadBlock, ImpBlock,
  NoteBlock, CodeBlock, SimBlock, AnimBlock, QuizBlock, DividerBlock
} from './types'
import { render } from './renderer'

// ─── LessonBuilder ────────────────────────────────────────────────────────────

export class LessonBuilder {
  private meta: LessonMeta
  private blocks: Block[] = []
  private options: BuildOptions

  constructor(title: string, options: BuildOptions = {}) {
    this.meta = {
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    this.options = {
      outDir: options.outDir ?? './out',
      contentBase: options.contentBase ?? '.',
      theme: options.theme ?? 'auto',
      ...options
    }
  }

  // ── Meta setters ────────────────────────────────────────────────────────────

  slug(slug: string): this {
    this.meta.slug = slug
    return this
  }

  description(text: string): this {
    this.meta.description = text
    return this
  }

  tags(...tags: string[]): this {
    this.meta.tags = tags
    return this
  }

  author(name: string): this {
    this.meta.author = name
    return this
  }

  // ── Content blocks ───────────────────────────────────────────────────────────

  /** Main heading section — becomes a sidebar entry with H2 */
  head(src: string, title?: string): this {
    this.blocks.push({ type: 'head', src: this.resolve(src), title } as HeadBlock)
    return this
  }

  /** Continue prose in the SAME section — no new sidebar entry */
  add(src: string): this {
    this.blocks.push({ type: 'add', src: this.resolve(src) } as AddBlock)
    return this
  }

  /** New subsection — H3 + new sidebar entry */
  subhead(src: string, label?: string): this {
    this.blocks.push({ type: 'subhead', src: this.resolve(src), label } as SubheadBlock)
    return this
  }

  /** Highlighted callout — important / warning / tip */
  imp(src: string | { inline: string }, variant: ImpBlock['variant'] = 'important'): this {
    const resolved = typeof src === 'string' ? this.resolve(src) : src
    this.blocks.push({ type: 'imp', src: resolved, variant } as ImpBlock)
    return this
  }

  /** Softer informational note */
  note(src: string | { inline: string }, variant: NoteBlock['variant'] = 'info'): this {
    const resolved = typeof src === 'string' ? this.resolve(src) : src
    this.blocks.push({ type: 'note', src: resolved, variant } as NoteBlock)
    return this
  }

  /** Syntax-highlighted code block */
  code(src: string | { inline: string }, lang?: string, label?: string): this {
    const resolved = typeof src === 'string' ? this.resolve(src) : src
    this.blocks.push({ type: 'code', src: resolved, lang, label } as CodeBlock)
    return this
  }

  // ── Interactive blocks ───────────────────────────────────────────────────────

  /** Sandboxed interactive simulation */
  sim(engine: string, props?: Record<string, unknown>, height = 420): this {
    this.blocks.push({
      type: 'sim',
      engine: this.resolve(engine),
      props,
      height
    } as SimBlock)
    return this
  }

  /** Passive animation player */
  anim(engine: string, opts: { loop?: boolean; height?: number; label?: string } = {}): this {
    this.blocks.push({
      type: 'anim',
      engine: this.resolve(engine),
      loop: opts.loop ?? true,
      height: opts.height ?? 360,
      label: opts.label
    } as AnimBlock)
    return this
  }

  /** Quiz block from .json */
  quiz(src: string): this {
    this.blocks.push({ type: 'quiz', src: this.resolve(src) } as QuizBlock)
    return this
  }

  /** Visual separator */
  divider(): this {
    this.blocks.push({ type: 'divider' } as DividerBlock)
    return this
  }

  // ── Output ───────────────────────────────────────────────────────────────────

  /** Returns the raw Lesson object (useful for testing or custom rendering) */
  toJSON(): Lesson {
    return { meta: this.meta, blocks: this.blocks }
  }

  /** Compiles everything and writes a single .html file to outDir */
  build(): string {
    const lesson: Lesson = { meta: this.meta, blocks: this.blocks }
    const html = render(lesson, this.options)

    const outDir = path.resolve(this.options.outDir!)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    const outPath = path.join(outDir, `${this.meta.slug}.html`)
    fs.writeFileSync(outPath, html, 'utf-8')

    console.log(`✓ Built → ${outPath}`)
    return outPath
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private resolve(src: string): string {
    if (path.isAbsolute(src)) return src
    return path.resolve(this.options.contentBase!, src)
  }
}

// ─── Factory function (the public API) ───────────────────────────────────────

export function lesson(title: string, options: BuildOptions = {}): LessonBuilder {
  return new LessonBuilder(title, options)
}
