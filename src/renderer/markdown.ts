import katex from "katex";
import { marked } from "marked";
import type { Block } from "../types";

// ─── Markdown Rendering (using Marked + KaTeX) ───────────────────────────────

function mdToHtml(md: string): { html: string; title: string } {
	let title = "";

	// Extract first H1 or H2 as title
	const titleMatch = md.match(/^(?:#|##)\s+(.+)$/m);
	if (titleMatch) {
		title = titleMatch[1].trim();
	}

	const mathBlocks: string[] = [];
	const mathInlines: string[] = [];

	// Temporarily mask code blocks so we don't extract math from them
	const codeBlocks: string[] = [];
	let processedMd = md.replace(/```[\s\S]+?```|`[^`\n]+`/g, (match) => {
		const id = codeBlocks.length;
		codeBlocks.push(match);
		return `@@BK_CODE_${id}@@`;
	});

	// Extract math and replace with placeholders
	processedMd = processedMd.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
		const id = mathBlocks.length;
		mathBlocks.push(tex);
		return `@@BK_MATH_BLOCK_${id}@@`;
	});

	processedMd = processedMd.replace(
		/\$(?!\s)([^$\n]+?)(?<!\s)\$/g,
		(_, tex) => {
			const id = mathInlines.length;
			mathInlines.push(tex);
			return `@@BK_MATH_INLINE_${id}@@`;
		},
	);

	// Restore code blocks
	codeBlocks.forEach((match, id) => {
		processedMd = processedMd.replace(`@@BK_CODE_${id}@@`, () => match);
	});

	let html = marked.parse(processedMd) as string;

	// Restore math
	mathBlocks.forEach((tex, id) => {
		const rendered = katex.renderToString(tex, {
			throwOnError: false,
			displayMode: true,
		});
		// marked might wrap block placeholders in <p>
		html = html.replace(
			`<p>@@BK_MATH_BLOCK_${id}@@</p>`,
			() => `<div class="bk-math-block">${rendered}</div>`,
		);
		// Fallback if not wrapped in <p>
		html = html.replace(
			`@@BK_MATH_BLOCK_${id}@@`,
			() => `<div class="bk-math-block">${rendered}</div>`,
		);
	});

	mathInlines.forEach((tex, id) => {
		const rendered = katex.renderToString(tex, {
			throwOnError: false,
			displayMode: false,
		});
		html = html.replace(`@@BK_MATH_INLINE_${id}@@`, () => rendered);
	});

	return { html, title };
}

function escHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escAttr(s: string): string {
	return escHtml(s);
}

function blockChrome(
	kind: string,
	label: string | undefined,
	caption: string | undefined,
	body: string,
	accent = "neutral",
): string {
	return `<figure class="bk-object bk-object--${escAttr(accent)}">
    <div class="bk-object-header">
      <span class="bk-object-kicker">${escHtml(kind)}</span>
      ${label ? `<span class="bk-object-title">${escHtml(label)}</span>` : ""}
      <button type="button" class="bk-object-maximize" aria-label="Maximize" title="Maximize">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>
    ${body}
    ${caption ? `<figcaption class="bk-caption">${mdInline(caption)}</figcaption>` : ""}
  </figure>`;
}

function mdInline(text: string): string {
	const mathInlines: string[] = [];
	const processedMd = text.replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (_, tex) => {
		const id = mathInlines.length;
		mathInlines.push(tex);
		return `@@BK_MATH_INLINE_${id}@@`;
	});

	let html = marked.parseInline(processedMd) as string;

	mathInlines.forEach((tex, id) => {
		const rendered = katex.renderToString(tex, {
			throwOnError: false,
			displayMode: false,
		});
		html = html.replace(`@@BK_MATH_INLINE_${id}@@`, () => rendered);
	});

	return html;
}

function renderSimulationControls(
	block: Extract<Block, { type: "simulation" }>,
): string {
	const props = block.props ?? {};
	const keys = Object.keys(block.tunables ?? props).filter((key) => {
		const value = props[key];
		return typeof value === "number" || typeof value === "boolean";
	});

	if (!keys.length || block.controls === "observe") return "";

	return `<div class="bk-sim-controls" aria-label="Simulation controls">
    ${keys
			.map((key) => {
				const value = props[key];
				const control = block.tunables?.[key] ?? {};
				const label = escHtml(control.label ?? key.replace(/([A-Z])/g, " $1"));
				if (typeof value === "boolean") {
					return `<label class="bk-sim-toggle">
            <input type="checkbox" data-bk-prop="${escAttr(key)}" ${value ? "checked" : ""}>
            <span>${label}</span>
          </label>`;
				}

				const min = control.min ?? Math.min(0, Number(value));
				const max = control.max ?? Math.max(10, Number(value) * 2);
				const step = control.step ?? 1;
				return `<label class="bk-sim-range">
          <span>${label}</span>
          <input type="range" data-bk-prop="${escAttr(key)}" min="${min}" max="${max}" step="${step}" value="${value}">
          <output>${value}</output>
        </label>`;
			})
			.join("")}
  </div>`;
}

function escapeScriptJson(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e");
}

export {
	blockChrome,
	escapeScriptJson,
	mdInline,
	mdToHtml,
	renderSimulationControls,
};
