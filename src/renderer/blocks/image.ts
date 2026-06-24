import type { BuildOptions, ImageBlock } from "../../types.js";
import { blockChrome } from "../markdown/index.js";
import { resolveAssetSrc } from "../utils.js";
import { escAttr } from "./utils.js";

export function renderImage(
	block: ImageBlock,
	_idx: number,
	options: BuildOptions,
): { html: string } {
	const src = resolveAssetSrc(block.src, options);
	return {
		html: blockChrome(
			"image",
			block.label,
			block.caption,
			`<div class="bk-media bk-media--image"><img src="${escAttr(src)}" alt="${escAttr(block.caption ?? "")}" loading="lazy"></div>`,
			"neutral",
		),
	};
}
