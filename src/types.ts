// ─── Block Types ─────────────────────────────────────────────────────────────

export type BlockType =
  | 'head'
  | 'add'
  | 'subhead'
  | 'imp'
  | 'note'
  | 'sim'
  | 'anim'
  | 'quiz'
  | 'divider'
  | 'code'

export interface BaseBlock {
  type: BlockType
}

// Markdown content blocks
export interface HeadBlock extends BaseBlock {
  type: 'head'
  src: string         // path to .md file
  title?: string      // override title extracted from md
}

export interface AddBlock extends BaseBlock {
  type: 'add'
  src: string         // path to .md file — continues same section, no sidebar entry
}

export interface SubheadBlock extends BaseBlock {
  type: 'subhead'
  src: string         // path to .md file — new sidebar entry + H3
  label?: string      // override sidebar label
}

export interface ImpBlock extends BaseBlock {
  type: 'imp'
  src: string | { inline: string }   // .md file OR raw string
  variant?: 'important' | 'warning' | 'tip'
}

export interface NoteBlock extends BaseBlock {
  type: 'note'
  src: string | { inline: string }
  variant?: 'info' | 'caution'
}

export interface CodeBlock extends BaseBlock {
  type: 'code'
  src: string | { inline: string }   // .ts/.py/.js file OR raw code string
  lang?: string
  label?: string
}

// Interactive blocks
export interface SimBlock extends BaseBlock {
  type: 'sim'
  engine: string                      // path to .js file
  props?: Record<string, unknown>     // passed to the sim as window.__simProps
  height?: number                     // iframe height, default 400
  label?: string                      // caption shown below
}

export interface AnimBlock extends BaseBlock {
  type: 'anim'
  engine: string                      // path to .js file
  loop?: boolean
  height?: number
  label?: string
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz'
  src: string                         // path to .json file
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
}

export type Block =
  | HeadBlock
  | AddBlock
  | SubheadBlock
  | ImpBlock
  | NoteBlock
  | CodeBlock
  | SimBlock
  | AnimBlock
  | QuizBlock
  | DividerBlock

// ─── Lesson Schema ────────────────────────────────────────────────────────────

export interface LessonMeta {
  title: string
  slug: string
  description?: string
  tags?: string[]
  author?: string
}

export interface Lesson {
  meta: LessonMeta
  blocks: Block[]
}

// ─── Quiz Schema (for .json files) ───────────────────────────────────────────

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number       // index of correct option
  explanation?: string
}

export interface QuizFile {
  questions: QuizQuestion[]
}

// ─── Build Options ────────────────────────────────────────────────────────────

export interface BuildOptions {
  outDir?: string          // default: './out'
  contentBase?: string     // base path for resolving .md / .js / .json files
  theme?: 'light' | 'dark' | 'auto'
  favicon?: string
}
