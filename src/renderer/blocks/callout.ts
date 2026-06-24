import type { BuildOptions, CalloutBlock } from "../../types.js";
import { mdToHtml } from "../markdown/index.js";
import { resolveContent } from "../utils.js";

export function renderCallout(
	block: CalloutBlock,
	_idx: number,
	options: BuildOptions,
): { html: string } {
	const variantMap = {
		important: "Important",
		warning: "Warning",
		tip: "Tip",
		note: "Note",
	};
	const label = variantMap[block.type];
	const md = resolveContent(block.src, options, "md");
	const { html } = mdToHtml(md, options);
	return {
		html: `<div class="bk-callout bk-callout--${block.type}">
          <div class="bk-callout-icon"></div>
          <div class="bk-callout-content">
            <div class="bk-callout-label">${label}</div>
            <div class="bk-callout-body">${html}</div>
          </div>
        </div>`,
	};
}
