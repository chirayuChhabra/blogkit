import type { BuildOptions, MarkdownBlock } from "../../types.js";
import { mdToHtml } from "../markdown/index.js";
import { type NavItem, resolveContent } from "../utils.js";

export function renderMarkdown(
	block: MarkdownBlock,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	const md = resolveContent(block.src, options, "md");
	const { html, headings } = mdToHtml(md);
	const navItems: NavItem[] = headings.map((h) => ({
		id: h.id,
		label: h.text,
		kind: h.level === 1 ? "heading" : "section",
	}));
	return {
		html: `<div class="bk-markdown">${html}</div>`,
		navItems: navItems.length > 0 ? navItems : undefined,
	};
}
