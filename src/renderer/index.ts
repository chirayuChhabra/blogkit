import type { BuildOptions, Lesson } from "../types.js";
import { renderBlock } from "./blocks.js";
import { renderPage } from "./html.js";
import type { NavItem } from "./utils.js";

// ─── Main render function ─────────────────────────────────────────────────────

export function render(lesson: Lesson, opts: BuildOptions = {}): string {
	const bodyItems: string[] = [];
	const structuredNavItems: NavItem[] = [];

	lesson.blocks.forEach((block, idx) => {
		const { html, navItems } = renderBlock(block, idx, opts);
		bodyItems.push(html);
		if (navItems) {
			structuredNavItems.push(...navItems);
		}
	});

	return renderPage(lesson, structuredNavItems, bodyItems.join("\n"), opts);
}

// ─── Chapter Rendering ────────────────────────────────────────────────────────

export { renderChapter } from "./chapter.js";
