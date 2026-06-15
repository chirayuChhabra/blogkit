import type { BuildOptions, HeadingBlock } from "../../types.js";
import { mdToHtml } from "../markdown/index.js";
import { type NavItem, resolveContent } from "../utils.js";

export function renderHeading(
	block: HeadingBlock,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	const md = resolveContent(block.src, options, "md");
	const { html, title } = mdToHtml(md);
	const label =
		block.title ||
		title ||
		(typeof block.src === "string" && !block.src.includes(".md")
			? block.src
			: "Heading");
	const id = `heading-${idx}`;
	return {
		html: `<section id="${id}" class="bk-section bk-heading">${html}</section>`,
		navItems: [{ id, label, kind: "heading" }],
	};
}
