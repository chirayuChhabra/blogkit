import katex from "katex";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import type { Block } from "../types.js";

marked.use(markedHighlight({
	langPrefix: 'hljs language-',
	highlight(code, lang) {
		const language = hljs.getLanguage(lang) ? lang : 'plaintext';
		return hljs.highlight(code, { language }).value;
	}
}));

// ─── Markdown Rendering (using Marked + KaTeX) ───────────────────────────────

function mdToHtml(md: string): { html: string; title: string; headings: { id: string; text: string; level: number }[] } {
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

	const headings: { id: string; text: string; level: number }[] = [];
	const idPrefix = Math.random().toString(36).substring(2, 6);
	let headingIdCounter = 0;

	const renderer = new marked.Renderer();
	renderer.heading = ({ tokens, depth, text }) => {
		const id = `bk-heading-${idPrefix}-${headingIdCounter++}`;
		if (depth === 1 || depth === 2) {
			const plainText = text.replace(/<[^>]+>/g, "");
			headings.push({ id, text: plainText, level: depth });
		}
		return `<h${depth} id="${id}" class="bk-heading-${depth}">${text}</h${depth}>`;
	};

	let html = marked.parse(processedMd, { renderer }) as string;

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

	return { html, title, headings };
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
	allowMaximize = true,
	id?: string,
): string {
	return `<figure ${id ? `id="${escAttr(id)}" ` : ""}class="bk-object bk-object--${escAttr(accent)}">
    <div class="bk-object-header">
      <span class="bk-object-kicker">${escHtml(kind)}</span>
      ${label ? `<span class="bk-object-title">${escHtml(label)}</span>` : ""}
      ${allowMaximize ? `<button type="button" class="bk-object-maximize" aria-label="Maximize" title="Maximize">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>` : ""}
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
		return typeof value === "number" || typeof value === "boolean" || typeof value === "string";
	});

	if (!keys.length || block.controls === "observe") return "";

	const controls = keys.map((key) => {
		const value = props[key];
		const control = block.tunables?.[key] ?? {};
		let type = control.type;
		if (!type) {
			if (typeof value === "boolean") type = "boolean";
			else if (typeof value === "string") type = "text";
			else type = "range";
		}
		const label = escHtml(control.label ?? key.replace(/([A-Z])/g, " $1"));
		return { key, value, control, type, label };
	});

	const ranges = controls.filter((c) => c.type === "range");
	const booleans = controls.filter((c) => c.type === "boolean");
	const others = controls.filter((c) => c.type === "text" || c.type === "number");

	const sortedControls = [...ranges, ...others, ...booleans];

	let firstBooleanRendered = false;

	return `<div class="bk-sim-controls" aria-label="Simulation controls">
    ${sortedControls
			.map(({ key, value, control, type, label }) => {
				if (type === "boolean") {
					const isFirst = !firstBooleanRendered;
					firstBooleanRendered = true;
					const extraClass = isFirst ? " bk-sim-toggle--first" : "";
					return `<label class="bk-sim-toggle${extraClass}">
            <input type="checkbox" data-bk-prop="${escAttr(key)}" ${value ? "checked" : ""}>
            <span>${label}</span>
          </label>`;
				}

				if (type === "text") {
					return `<label class="bk-sim-text">
            <span>${label}</span>
            <input type="text" data-bk-prop="${escAttr(key)}" value="${escAttr(String(value))}">
          </label>`;
				}

				if (type === "number") {
					const min = control.min ?? "";
					const max = control.max ?? "";
					const step = control.step ?? "any";
					return `<label class="bk-sim-number">
            <span>${label}</span>
            <input type="number" data-bk-prop="${escAttr(key)}" min="${min}" max="${max}" step="${step}" value="${value}">
          </label>`;
				}

				// type === "range"
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
