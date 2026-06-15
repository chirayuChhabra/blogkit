import type { AnimationBlock, BuildOptions } from "../../types.js";
import { blockChrome } from "../markdown/index.js";
import { resolveContent } from "../utils.js";
import { iframeDoc } from "./iframe.js";

export function renderAnimation(
	block: AnimationBlock,
	idx: number,
	options: BuildOptions,
): { html: string } {
	const animSrc = resolveContent(block.src, options, "js");
	return {
		html: blockChrome(
			"Animation",
			block.label,
			block.caption,
			`<div class="bk-embed-frame bk-embed-interactive" data-is-animation="true">
            <div class="bk-embed-overlay" tabindex="0" role="button" aria-label="Activate interactive animation">
              <span class="bk-embed-overlay-text">Click to interact</span>
            </div>
            <iframe srcdoc="${iframeDoc(animSrc, "{}", block.loop)}"
              sandbox="allow-scripts"
              loading="lazy"
              style="width:100%;height:100%;border:none;display:block;">
            </iframe>
          </div>`,
			block.accent ?? "neutral",
		),
	};
}
