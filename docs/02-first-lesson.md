
In Mr Markdown, your course is built by grouping **Lessons** inside **Chapters**.

When you run `bunx md init`, it generates a folder structure based on your answers. Assuming you accepted the defaults ("First Chapter" and "First Lesson"), it generated a folder structure that looks like this:

```text
my-course/
├── chapters/
│   └── 01-first-chapter/
│       ├── chapter.ts
│       └── lessons/
│           └── 01-first-lesson/
│               ├── lesson.ts
│               ├── content/
│               │   └── intro.md
│               ├── media/
│               ├── sims/
│               └── quizzes/
├── package.json
└── tsconfig.json
```

Let's look at the two most important files in this structure: `chapter.ts` and `lesson.ts`.

## The Chapter File (`chapter.ts`)

Open `chapters/01-first-chapter/chapter.ts`. This file is responsible for defining your chapter and linking all its lessons together.

```ts
import { chapter } from "mr-md";
import { myLesson } from "./lessons/01-first-lesson/lesson.js";

// 1. We create a new chapter and give it a title
export const myChapter = chapter("My First Chapter", { outDir: "../../out", contentBase: import.meta.dir }, ctx => {
  
  // 2. We set the URL slug for this chapter
  ctx.slug("intro");
  
  // 3. We add our lessons to the chapter in the order we want them to appear
  ctx.lesson(myLesson);
});

// This line allows the chapter to be built directly if we run this file with Bun
if (import.meta.main) {
  myChapter.build();
}
```

## The Lesson File (`lesson.ts`)

A lesson is a single learning page. Let's look at `chapters/01-first-chapter/lessons/01-first-lesson/lesson.ts`.

```ts
import { lesson } from "mr-md";

// 1. We define the lesson with a Title. 
// 2. We MUST set `contentBase: import.meta.dir` so the framework knows where to find our files!
export const myLesson = lesson("Hello World", { contentBase: import.meta.dir }, ctx => {
  
  // 3. Give the lesson a short description (used for SEO and page metadata)
  ctx.description("My very first lesson.");
  
  // 4. Start adding content!
  ctx.add("content/intro.md");
});
```

The `ctx` (context) object is your primary tool. You use it to sequence the blocks of your lesson from top to bottom. 

### What does `ctx.add()` do?

The `ctx.add()` method is a "smart router". You just give it a file path, and it figures out what to do with it:

* **`ctx.add("content/intro.md")`** → Parses and renders standard Markdown.
* **`ctx.add("quizzes/knowledge-check.json")`** → Renders an Interactive Quiz.
* **`ctx.add("media/image.png")`** → Embeds an image.
* **`ctx.add("https://youtu.be/...")`** → Embeds a YouTube video securely.

### Using the CLI Generators

Instead of manually creating folders and files every time, you can use the CLI generators. **Crucially, you must run these commands from the correct directory** so they scaffold files in the right place and auto-import correctly!

#### Generating a Chapter
Run from the **root of your project**:
```bash
bunx md g chapter "My New Chapter"
```
This creates a new folder in `chapters/` with a fresh `chapter.ts`.

#### Generating a Lesson
Run from inside a specific **chapter directory** (e.g., `cd chapters/01-first-chapter`):
```bash
bunx md g lesson "My Second Lesson"
```
This will:
1. Create a new `02-my-second-lesson/` directory inside that chapter's `lessons/` folder.
2. Automatically modify the parent `chapter.ts` to import and include the new lesson!

#### Generating a Quiz
Run from inside a specific **lesson directory** (e.g., `cd chapters/01-first-chapter/lessons/01-first-lesson`):
```bash
bunx md g quiz "knowledge-check"
```
This creates a fresh quiz JSON file inside `quizzes/` and automatically injects `ctx.quiz()` into your `lesson.ts`.

---

**Next up:** In the next section, we will look at how to structure text, headings, and callout boxes using Core Blocks.
