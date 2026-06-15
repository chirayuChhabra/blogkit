import type { SpacerBlock } from "../../types.js";

export function renderSpacer(block: SpacerBlock): { html: string } {
	return {
		html: `<div class="bk-spacer" style="height: ${block.size * 24}px; flex-shrink: 0;" aria-hidden="true"></div>`,
	};
}
