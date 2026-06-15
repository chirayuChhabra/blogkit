import hljs from "highlight.js";
import type { BuildOptions, CodeBlock } from "../../types.js";
import { resolveContent } from "../utils.js";
import { escHtml } from "./utils.js";

export function renderCode(
	block: CodeBlock,
	idx: number,
	options: BuildOptions,
): { html: string } {
	const raw = resolveContent(block.src, options, "text"); // Could be file or inline
	const isInlineCode =
		typeof block.src === "string" &&
		(block.src.includes("\n") || block.src.includes(" "));
	const lang =
		block.lang ??
		(typeof block.src === "string" && !isInlineCode && block.src.includes(".")
			? (block.src.split(".").pop() ?? "")
			: "");
	let highlighted = escHtml(raw);
	if (lang && hljs.getLanguage(lang)) {
		highlighted = hljs.highlight(raw, { language: lang }).value;
	} else {
		highlighted = hljs.highlightAuto(raw).value;
	}
	return {
		html: `<div class="bk-code-block">
          ${block.label ? `<div class="bk-code-header"><span class="bk-code-label">${escHtml(block.label)}</span><span class="bk-code-lang">${lang}</span></div>` : ""}
          <div class="bk-code-scroll">
            <pre><code class="language-${lang} hljs">${highlighted}</code></pre>
          </div>
        </div>`,
	};
}
