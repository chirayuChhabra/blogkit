import { escAttr, escHtml } from "../blocks.js";
import { mdInline } from "./sanitize.js";

export function blockChrome(
	kind: string,
	label: string | undefined,
	caption: string | undefined,
	body: string,
	accent = "neutral",
	allowMaximize = true,
	id?: string,
): string {
	return `<figure ${id ? `id="${escAttr(id)}" ` : ""}class="bk-object bk-object--${escAttr(accent)}">
    <div class="bk-object-header">
      <span class="bk-object-kicker">${escHtml(kind)}</span>
      ${label ? `<span class="bk-object-title">${escHtml(label)}</span>` : ""}
      ${
				allowMaximize
					? `<button type="button" class="bk-object-maximize" aria-label="Maximize" title="Maximize">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>`
					: ""
			}
    </div>
    ${body}
    ${caption ? `<figcaption class="bk-caption">${mdInline(caption)}</figcaption>` : ""}
  </figure>`;
}

export function escapeScriptJson(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e");
}
