import katex from "katex";
import type { BuildOptions, ColumnsBlock } from "../../types.js";
import { blockChrome, mdToHtml, sanitizeHtml } from "../markdown/index.js";
import { resolveContent } from "../utils.js";

export function renderColumns(
	block: ColumnsBlock,
	_idx: number,
	options: BuildOptions,
): { html: string } {
	return {
		html: blockChrome(
			"Columns",
			block.label,
			block.caption,
			`<div class="bk-columns" style="grid-template-columns: repeat(${block.columns.length}, minmax(0, 1fr))">
            ${block.columns
							.map((column) => {
								const content =
									column.latex != null
										? `<div class="bk-latex-block">${sanitizeHtml(katex.renderToString(column.latex, { throwOnError: false, displayMode: true }))}</div>`
										: column.code != null
											? mdToHtml(`\`\`\`\n${column.code}\n\`\`\``, options).html
											: mdToHtml(
													column.markdown ??
														(column.src
															? resolveContent(column.src, options, "md")
															: ""),
													options,
												).html;
								return `<div class="bk-column">${content}</div>`;
							})
							.join("")}
          </div>`,
			"neutral",
			false,
		),
	};
}
