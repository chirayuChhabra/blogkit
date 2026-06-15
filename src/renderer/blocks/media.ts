import type { BuildOptions, MediaBlock } from "../../types.js";
import { blockChrome } from "../markdown/index.js";
import { resolveAssetSrc } from "../utils.js";
import { escAttr } from "./utils.js";

export function renderMedia(
	block: MediaBlock,
	idx: number,
	options: BuildOptions,
): { html: string } {
	const src = resolveAssetSrc(block.src, options);
	const media =
		block.kind === "image"
			? `<img src="${escAttr(src)}" alt="${escAttr(block.alt ?? "")}" loading="lazy">`
			: block.kind === "video"
				? `<video src="${escAttr(src)}" ${block.poster ? `poster="${escAttr(resolveAssetSrc(block.poster, options))}"` : ""} ${block.controls !== false ? "controls" : ""} playsinline></video>`
				: `<audio src="${escAttr(src)}" ${block.controls !== false ? "controls" : ""}></audio>`;

	return {
		html: blockChrome(
			block.kind,
			block.label,
			[block.caption, block.credit ? `Credit: ${block.credit}` : ""]
				.filter(Boolean)
				.join(" "),
			`<div class="bk-media bk-media--${block.kind}">${media}</div>`,
			"neutral",
		),
	};
}
