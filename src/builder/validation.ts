import type { Block, BuildOptions, LessonMeta } from "../types.js";

export function validateLesson(
	meta: LessonMeta,
	blocks: Block[],
	options: BuildOptions,
): void {
	const isStrict = options.strict ?? process.env.NODE_ENV !== "development";
	if (!isStrict) return;

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
