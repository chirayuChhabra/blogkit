import { course, chapter } from "../src/index";
import { physicsChapter } from "./chapter";

// In a real app, chapters would typically be imported from their own files
// just like we did with physicsChapter above.
const quantumChapter = chapter("Quantum Mechanics")
	.description("The weird world of the very small")
	.status("locked");

const relativityChapter = chapter("Relativity")
	.description("Space, time, and gravity")
	.status("locked");

course("Physics Journey", { theme: "dark" })
	.description("Your path to understanding the universe")
	.chapter(physicsChapter.status("active")) // Imported from chapter.ts
	.chapter(quantumChapter)
	.chapter(relativityChapter)
	.build();
