import type { BuildOptions, SectionBlock } from "../../types.js";
import { mdToHtml } from "../markdown/index.js";
import { type NavItem, resolveContent } from "../utils.js";

export function renderSection(
	block: SectionBlock,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	const md = resolveContent(block.src, options, "md");
	const { html, title } = mdToHtml(md);
	const label =
		block.label ||
		title ||
		(typeof block.src === "string" && !block.src.includes(".md")
			? block.src
			: "Section");
	const id = `section-${idx}`;
	return {
		html: `<section id="${id}" class="bk-section bk-subsection">${html}</section>`,
		navItems: [{ id, label, kind: "section" }],
	};
}
