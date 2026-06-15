import katex from "katex";
import type { BuildOptions, LatexBlock } from "../../types.js";
import { blockChrome, sanitizeHtml } from "../markdown/index.js";

export function renderLatex(
	block: LatexBlock,
	idx: number,
	options: BuildOptions,
): { html: string } {
	const rendered = sanitizeHtml(
		katex.renderToString(block.tex, {
			throwOnError: false,
			displayMode: block.display ?? true,
		}),
	);
	return {
		html: blockChrome(
			"LaTeX",
			block.label,
			block.caption,
			`<div class="${block.display === false ? "bk-latex-inline" : "bk-latex-block"}">${rendered}</div>`,
			"violet",
			false,
		),
	};
}
