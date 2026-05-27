import * as fs from "fs";
import katex from "katex";
import { marked } from "marked";
import * as path from "path";
import type {
	Block,
	BuildOptions,
	Chapter,
	Lesson,
	QuizFile,
	QuizQuestion,
} from "./types";

// ─── Smart Content Resolution ────────────────────────────────────────────────

interface NavItem {
	id: string;
	label: string;
	kind: "heading" | "section" | "quiz";
}

function resolveContent(
	src: string,
	options: BuildOptions,
	expectedType: "md" | "js" | "json" | "text" = "text",
): string {
	if (src.includes("\n")) return src;

	const isLikelyFilePath =
		(expectedType !== "text" && src.endsWith(`.${expectedType}`)) ||
		src.startsWith("/") ||
		src.startsWith("./") ||
		src.startsWith("../");

	const filePath = path.isAbsolute(src)
		? src
		: path.resolve(options.contentBase ?? ".", src);

	if (fs.existsSync(filePath)) {
		const stat = fs.statSync(filePath);
		if (stat.isFile()) {
			return fs.readFileSync(filePath, "utf-8");
		}
	}

	if (isLikelyFilePath && options.strict !== false) {
		throw new Error(
			`Missing ${expectedType.toUpperCase()} content: ${filePath}`,
		);
	}

	// If it's not a valid file path, or the file doesn't exist, treat it as raw text
	return src;
}

function resolveAssetSrc(src: string, options: BuildOptions): string {
	if (/^(https?:|data:|\/)/.test(src)) return src;

	const filePath = path.resolve(options.contentBase ?? ".", src);
	if (!fs.existsSync(filePath)) {
		if (options.strict !== false)
			throw new Error(`Missing media asset: ${filePath}`);
		return src;
	}

	const ext = path.extname(filePath).toLowerCase();
	const mime =
		ext === ".svg"
			? "image/svg+xml"
			: ext === ".png"
				? "image/png"
				: ext === ".jpg" || ext === ".jpeg"
					? "image/jpeg"
					: ext === ".webp"
						? "image/webp"
						: ext === ".gif"
							? "image/gif"
							: ext === ".avif"
								? "image/avif"
								: ext === ".mp4"
									? "video/mp4"
									: ext === ".webm"
										? "video/webm"
										: ext === ".mp3"
											? "audio/mpeg"
											: ext === ".wav"
												? "audio/wav"
												: "application/octet-stream";

	return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

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

	processedMd = processedMd.replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (_, tex) => {
		const id = mathInlines.length;
		mathInlines.push(tex);
		return `@@BK_MATH_INLINE_${id}@@`;
	});

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

// ─── Block renderers ──────────────────────────────────────────────────────────

function renderBlock(
	block: Block,
	idx: number,
	options: BuildOptions,
): { html: string; navItem?: NavItem } {
	try {
		const result = renderBlockInner(block, idx, options);
		if (result.html && "src" in block && typeof block.src === "string" && block.src.includes(".")) {
			result.html = result.html.replace(/^<([a-zA-Z0-9-]+)([^>]*)>/, `<$1 data-bk-src="${escAttr(block.src)}"$2>`);
		}
		return result;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.warn(`  ⚠ Error rendering block ${idx + 1} (${block.type}): ${msg}`);
		const errorHtml = `<div class="bk-callout bk-callout--warning"><div class="bk-callout-icon"></div><div class="bk-callout-content"><div class="bk-callout-label">Block Error (${escHtml(block.type)})</div><div class="bk-callout-body"><p>${escHtml(msg)}</p></div></div></div>`;
		return { html: errorHtml };
	}
}

function renderBlockInner(
	block: Block,
	idx: number,
	options: BuildOptions,
): { html: string; navItem?: NavItem } {
	switch (block.type) {
		case "heading": {
			const md = resolveContent(block.src, options, "md");
			const { html, title } = mdToHtml(md);
			const label = block.title ?? title ?? "Heading";
			const id = `heading-${idx}`;
			return {
				html: `<section id="${id}" class="bk-section bk-heading">${html}</section>`,
				navItem: { id, label, kind: "heading" },
			};
		}

		case "markdown": {
			const md = resolveContent(block.src, options, "md");
			const { html } = mdToHtml(md);
			return { html: `<div class="bk-markdown">${html}</div>` };
		}

		case "section": {
			const md = resolveContent(block.src, options, "md");
			const { html, title } = mdToHtml(md);
			const label = block.label ?? title ?? "Section";
			const id = `section-${idx}`;
			return {
				html: `<section id="${id}" class="bk-section bk-subsection">${html}</section>`,
				navItem: { id, label, kind: "section" },
			};
		}

		case "important":
		case "warning":
		case "tip":
		case "note": {
			const variantMap = {
				important: "Important",
				warning: "Warning",
				tip: "Tip",
				note: "Note",
			};
			const label = variantMap[block.type];
			const md = resolveContent(block.src, options, "md");
			const { html } = mdToHtml(md);
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

		case "code": {
			const raw = resolveContent(block.src, options, "text"); // Could be file or inline
			const lang =
				block.lang ??
				(typeof block.src === "string" && block.src.includes(".")
					? (block.src.split(".").pop() ?? "")
					: "");
			return {
				html: `<div class="bk-code-block">
          ${block.label ? `<div class="bk-code-header"><span class="bk-code-label">${escHtml(block.label)}</span><span class="bk-code-lang">${lang}</span></div>` : ""}
          <div class="bk-code-scroll">
            <pre><code class="language-${lang}">${escHtml(raw)}</code></pre>
          </div>
        </div>`,
			};
		}

		case "simulation": {
			const propsJson = JSON.stringify(block.props ?? {});
			const simSrc = resolveContent(block.src, options, "js");
			const simConfig = { js: simSrc, loop: false };
			return {
				html: blockChrome(
					block.controls === "observe" ? "Simulation" : "Interactive Lab",
					block.label,
					block.caption,
					`${renderSimulationControls(block)}
          <div class="bk-embed-frame bk-embed-interactive bk-aspect-${block.aspect ?? "wide"}" ${block.height ? `style="height:${block.height}px"` : ""}>
            <div class="bk-embed-overlay" tabindex="0" role="button" aria-label="Activate interactive simulation">
              <span class="bk-embed-overlay-text">Click to interact</span>
            </div>
            <iframe srcdoc="${iframeDoc(simSrc, propsJson)}"
              sandbox="allow-scripts"
              style="width:100%;height:100%;border:none;display:block;">
            </iframe>
          </div>
          <script type="application/json" class="bk-sim-config">${escapeScriptJson(simConfig)}</script>`,
					block.accent ?? "blue",
				),
			};
		}

		case "animation": {
			const animSrc = resolveContent(block.src, options, "js");
			return {
				html: blockChrome(
					"Animation",
					block.label,
					block.caption,
					`<div class="bk-embed-frame bk-embed-interactive bk-aspect-${block.aspect ?? "wide"}" ${block.height ? `style="height:${block.height}px"` : ""}>
            <div class="bk-embed-overlay" tabindex="0" role="button" aria-label="Activate interactive animation">
              <span class="bk-embed-overlay-text">Click to interact</span>
            </div>
            <iframe srcdoc="${iframeDoc(animSrc, "{}", block.loop)}"
              sandbox="allow-scripts"
              style="width:100%;height:100%;border:none;display:block;">
            </iframe>
          </div>`,
					block.accent ?? "neutral",
				),
			};
		}

		case "media": {
			const src = resolveAssetSrc(block.src, options);
			const aspectClass = `bk-aspect-${block.aspect ?? "auto"}`;
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
					`<div class="bk-media bk-media--${block.kind} ${aspectClass}">${media}</div>`,
					"neutral",
				),
			};
		}

		case "youtube": {
			const params = new URLSearchParams();
			params.set("rel", "0");
			if (block.start) params.set("start", String(block.start));
			return {
				html: blockChrome(
					"YouTube",
					block.label,
					block.caption,
					`<div class="bk-embed-frame bk-aspect-${block.aspect ?? "wide"}">
            <iframe src="https://www.youtube-nocookie.com/embed/${escAttr(block.id)}?${params.toString()}&origin=https://youtube.com"
              title="${escAttr(block.label ?? "YouTube video")}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy"
              style="width:100%;height:100%;border:none;display:block;">
            </iframe>
          </div>`,
					"neutral",
				),
			};
		}

		case "latex": {
			const rendered = katex.renderToString(block.tex, {
				throwOnError: false,
				displayMode: block.display ?? true,
			});
			return {
				html: blockChrome(
					"LaTeX",
					block.label,
					block.caption,
					`<div class="${block.display === false ? "bk-latex-inline" : "bk-latex-block"}">${rendered}</div>`,
					"violet",
				),
			};
		}

		case "columns": {
			return {
				html: blockChrome(
					"Columns",
					block.label,
					block.caption,
					`<div class="bk-columns" style="grid-template-columns:${block.columns
						.map((column) => column.width ?? "minmax(0, 1fr)")
						.join(" ")}">
            ${block.columns
							.map((column) => {
								const content =
									column.latex != null
										? `<div class="bk-latex-block">${katex.renderToString(column.latex, { throwOnError: false, displayMode: true })}</div>`
										: mdToHtml(
												column.markdown ??
													(column.src
														? resolveContent(column.src, options, "md")
														: ""),
											).html;
								return `<div class="bk-column">${content}</div>`;
							})
							.join("")}
          </div>`,
					"neutral",
				),
			};
		}

		case "quiz": {
			let quiz: QuizFile = { questions: [] };
			const rawJson = resolveContent(block.src, options, "json");
			try {
				quiz = JSON.parse(rawJson);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (options.strict !== false) {
					throw new Error(`Invalid Quiz JSON for block ${idx + 1}: ${msg}`);
				}
				console.warn(`  ⚠ Invalid Quiz JSON for block ${idx + 1}:`, e);
				return { html: `<div class="bk-callout bk-callout--warning"><div class="bk-callout-icon"></div><div class="bk-callout-content"><div class="bk-callout-label">Quiz JSON Error</div><div class="bk-callout-body"><p>${escHtml(msg)}</p></div></div></div>` };
			}

			return {
				html: `<div class="bk-quiz" id="quiz-${idx}">
          <div class="bk-quiz-head">
            <span>${escHtml(block.label ?? "Check your understanding")}</span>
            ${block.caption ? `<small>${mdInline(block.caption)}</small>` : ""}
          </div>
          <div class="bk-quiz-body">
            ${quiz.questions.map((q, qi) => renderQuestion(q, `quiz-${idx}`, qi)).join("\n")}
          </div>
        </div>`,
				navItem: {
					id: `quiz-${idx}`,
					label: block.label ?? "Questions",
					kind: "quiz",
				},
			};
		}

		case "divider":
			return { html: '<hr class="bk-divider">' };

		default:
			return { html: "" };
	}
}

function renderQuestion(q: QuizQuestion, quizId: string, qi: number): string {
	const qid = `${quizId}-q${qi}`;
	const options = q.options
		.map(
			(opt, oi) => `
    <button class="bk-opt" data-correct="${oi === q.answer}" onclick="bkAnswer(this,'${qid}')">
      <span class="bk-opt-dot"></span><span class="bk-opt-text">${mdInline(opt)}</span>
    </button>`,
		)
		.join("");

	const expHtml = q.explanation
		? `<div class="bk-explanation" id="${qid}-exp" hidden>${mdToHtml(q.explanation).html}</div>`
		: "";

	return `
    <div class="bk-question" id="${qid}">
      <div class="bk-q-text">${mdToHtml(q.q).html}</div>
      <div class="bk-opts">${options}</div>
      ${expHtml}
    </div>`;
}

// Wraps a JS string in a minimal iframe document
function iframeDoc(js: string, props: string, loop?: boolean): string {
	const doc = `<!DOCTYPE html><html><head>
<style>
  html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
  canvas { display: block; touch-action: none; transform-origin: center center; }
  body { background: #ffffff; color: #111; font-family: sans-serif; }
  @media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #eee; } }
</style>
</head><body>
<canvas id="c" width="800" height="500"></canvas>
<script>
window.__simProps=${props};
window.__loop=${loop ?? false};
window.bkSetup = function(logicalW, logicalH, loopFn) {
  const canvas = document.getElementById("c");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  window.parent.postMessage({type:"bk:aspect",aspect:logicalW/logicalH}, "*");
  
  function loop() {
    const bw = window.innerWidth;
    const bh = window.innerHeight;
    const cssScale = Math.max(bw / logicalW, bh / logicalH);
    const dpr = window.devicePixelRatio || 1;
    const bitmapScale = cssScale * dpr;
    
    const nextW = Math.floor(logicalW * bitmapScale);
    const nextH = Math.floor(logicalH * bitmapScale);
    
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
      canvas.style.width = logicalW + "px";
      canvas.style.height = logicalH + "px";
      canvas.style.transform = "scale(" + cssScale + ")";
    }
    
    ctx.save();
    ctx.scale(bitmapScale, bitmapScale);
    
    loopFn(ctx, logicalW, logicalH);
    
    ctx.restore();
    requestAnimationFrame(loop);
  }
  loop();
};

window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "bk:set-props") return;
  window.__simProps = { ...window.__simProps, ...event.data.props };
  window.dispatchEvent(new CustomEvent("bk:props", { detail: window.__simProps }));
});
try {
  ${js}
} catch (e) {
  console.error("Simulation Error:", e);
  document.body.innerHTML = '<div style="padding:20px;color:red;font-family:monospace">Error: ' + e.message + '</div>';
}
</script>
</body></html>`;
	// We use double quotes for the srcdoc attribute, so we must escape them.
	return doc
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function renderNavItem(item: NavItem): string {
	const kindClass =
		item.kind === "heading"
			? "bk-nav-heading"
			: item.kind === "quiz"
				? "bk-nav-quiz"
				: "bk-nav-sub";
	return `<a href="#${item.id}" class="bk-nav-item ${kindClass}" data-id="${item.id}">${escHtml(item.label)}</a>`;
}

function renderEndNav(navItems: NavItem[]): string {
	if (navItems.length < 2) return "";
	const first = navItems[0];
	const next = navItems[1] ?? first;
	const last = navItems[navItems.length - 1];
	return `<nav class="bk-end-nav" aria-label="Lesson navigation">
    <a class="bk-end-link bk-end-link--prev" href="#${first.id}">
      <span>Previous</span>
      <strong>${escHtml(first.label)}</strong>
    </a>
    <a class="bk-end-link bk-end-link--next" href="#${next.id}">
      <span>Next</span>
      <strong>${escHtml(next.label)}</strong>
    </a>
    <a class="bk-end-link" href="#${last.id}">
      <span>Jump to end</span>
      <strong>${escHtml(last.label)}</strong>
    </a>
  </nav>`;
}

function renderPage(
	lesson: Lesson,
	navItems: NavItem[],
	bodyHtml: string,
	opts: BuildOptions,
): string {
	const theme = opts.theme ?? "auto";
	const schemeAttr = theme === "auto" ? "" : `data-theme="${theme}"`;
	const preset = opts.preset ?? {};
	const layout = preset.layout ?? "lesson";
	const density = preset.density ?? "comfortable";
	const tone = preset.tone ?? "scholarly";
	const palette = opts.palette ?? "ink";
	const navHtml = navItems.map(renderNavItem).join("\n");
	const endNavHtml = renderEndNav(navItems);

	return `<!DOCTYPE html>
<html lang="en" data-palette="${palette}" ${schemeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(lesson.meta.title)}</title>
${lesson.meta.description ? `<meta name="description" content="${escHtml(lesson.meta.description)}">` : ""}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css">
${opts.head ?? ""}
<style>
${opts.font ? `:root { --font-sans: ${opts.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }` : ""}
${pageCSS()}
</style>
</head>
<body class="bk-layout-${layout} bk-density-${density} bk-tone-${tone}">
<div class="bk-shell">
  <aside class="bk-sidebar">
    <div class="bk-sidebar-inner">
      <div class="bk-sidebar-header">
        <div class="bk-sidebar-header-top">
          <div style="flex-grow: 1;"></div>
          <button class="bk-icon-btn bk-sidebar-collapse" id="bk-sidebar-collapse" type="button" aria-label="Collapse sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M9 3v18"/><path d="M14 15l-3-3 3-3"/></svg>
          </button>
        </div>
        ${lesson.meta.parentSlug ? `<a href="${lesson.meta.parentSlug}.html" class="bk-back-link" aria-label="Back to Chapter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>Back to Chapter</a>` : ""}
        <div class="bk-sidebar-title">${escHtml(lesson.meta.title)}</div>
        ${lesson.meta.author ? `<div class="bk-sidebar-author">By ${escHtml(lesson.meta.author)}</div>` : ""}
        ${lesson.meta.tags?.length ? `<div class="bk-tag-row">${lesson.meta.tags.map((tag) => `<span>${escHtml(tag)}</span>`).join("")}</div>` : ""}
      </div>
      <nav class="bk-nav">${navHtml}</nav>
      <div class="bk-sidebar-footer">
        <button class="bk-icon-btn bk-settings-button" id="bk-settings-button" type="button" aria-expanded="false" aria-controls="bk-theme-panel" title="Display settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="bk-sr-only">Display settings</span>
        </button>
        <div class="bk-theme-panel" id="bk-theme-panel" aria-label="Display settings" hidden>
          <label>
            <span>Theme</span>
            <select id="bk-theme-select">
              <option value="auto" ${theme === "auto" ? "selected" : ""}>System</option>
              <option value="light" ${theme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${theme === "dark" ? "selected" : ""}>Dark</option>
            </select>
          </label>
          <label>
            <span>Palette</span>
            <select id="bk-palette-select">
              <option value="ink" ${palette === "ink" ? "selected" : ""}>Ink</option>
              <option value="field" ${palette === "field" ? "selected" : ""}>Field</option>
              <option value="ember" ${palette === "ember" ? "selected" : ""}>Ember</option>
            </select>
          </label>
        </div>
      </div>
      <nav class="bk-nav">${navHtml}</nav>
    </div>
  </aside>
  <main class="bk-main">
    <button class="bk-sidebar-expand" id="bk-sidebar-expand" type="button" aria-label="Expand sidebar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <article class="bk-content">
      <header class="bk-hero">
        <p class="bk-eyebrow">Interactive Lesson</p>
        <h1>${escHtml(lesson.meta.title)}</h1>
        ${lesson.meta.description ? `<p class="bk-deck">${escHtml(lesson.meta.description)}</p>` : ""}
      </header>
      ${bodyHtml}
      ${endNavHtml}
    </article>
  </main>
</div>
<script>
${clientScript()}
</script>
</body>
</html>`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

function pageCSS(): string {
	return `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,650;9..144,760&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: 'Fraunces', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --bg: #f7f3ec;
  --paper: #fffdf8;
  --panel: #f0eee8;
  --panel-strong: #e7e1d6;
  --ink: #17130f;
  --muted: #695f53;
  --faint: #958b7f;
  --line: #ded5c8;
  --line-strong: #b9ab99;
  --code-bg: #171a1f;
  --text-code: #f1f1f1;
  --blue: #315f8c;
  --teal: #246b61;
  --amber: #9a6525;
  --rose: #9a3f4d;
  --violet: #69559f;
  --accent: var(--blue);
  --accent-soft: #e4eef6;
  --correct-bg: #e5f3ed;
  --correct-line: #2c7a57;
  --wrong-bg: #f8e5e2;
  --wrong-line: #b44a3e;
  --shadow: 0 24px 70px rgba(32, 24, 15, 0.12);
}

html[data-palette="field"] {
  --bg: #eff5ef;
  --paper: #fbfff9;
  --panel: #e8f0e6;
  --panel-strong: #dbe7d8;
  --ink: #111810;
  --muted: #596a55;
  --line: #cbd9c7;
  --line-strong: #9db39a;
  --blue: #2f6f5f;
  --teal: #1e7a56;
  --amber: #85712b;
  --rose: #8f4852;
  --violet: #566b9e;
  --accent: var(--teal);
  --accent-soft: #dceee3;
}

html[data-palette="ember"] {
  --bg: #f5f0ec;
  --paper: #fffdfa;
  --panel: #f0e7df;
  --panel-strong: #e5d5c8;
  --ink: #1b1411;
  --muted: #715d52;
  --line: #dccbc0;
  --line-strong: #b99e8c;
  --blue: #255f89;
  --teal: #2f665d;
  --amber: #a25c25;
  --rose: #9b3f3a;
  --violet: #725798;
  --accent: var(--rose);
  --accent-soft: #f2dfdd;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #11100f;
    --paper: #191817;
    --panel: #22201d;
    --panel-strong: #2b2824;
    --ink: #f4efe7;
    --muted: #b8aa99;
    --faint: #887b6d;
    --line: #36312c;
    --line-strong: #5b5046;
    --code-bg: #0b0d10;
    --text-code: #f1f1f1;
    --accent-soft: #1a2a36;
    --correct-bg: #173329;
    --correct-line: #61b58d;
    --wrong-bg: #351f20;
    --wrong-line: #d56c60;
    --shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  }
}

:root[data-theme="dark"] {
  --bg: #11100f;
  --paper: #191817;
  --panel: #22201d;
  --panel-strong: #2b2824;
  --ink: #f4efe7;
  --muted: #b8aa99;
  --faint: #887b6d;
  --line: #36312c;
  --line-strong: #5b5046;
  --code-bg: #0b0d10;
  --text-code: #f1f1f1;
  --accent-soft: #1a2a36;
  --correct-bg: #173329;
  --correct-line: #61b58d;
  --wrong-bg: #351f20;
  --wrong-line: #d56c60;
  --shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 34%),
    radial-gradient(circle at 88% 6%, color-mix(in srgb, var(--teal) 10%, transparent), transparent 30%),
    var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.bk-shell {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
}

.bk-sidebar {
  width: 288px;
  flex-shrink: 0;
  position: relative;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: margin-left 0.3s ease, opacity 0.3s ease;
}
.bk-shell[data-collapsed="true"] .bk-sidebar {
  margin-left: -288px;
  opacity: 0;
}
.bk-main {
  flex-grow: 1;
  position: relative;
  height: 100vh;
  overflow-y: auto;
  min-width: 0;
}
.bk-sidebar-inner { padding: 28px 0; display: flex; flex-direction: column; min-height: 100%; box-sizing: border-box; }
.bk-sidebar-header { position: relative; padding: 0 22px 24px; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.bk-brand-mark {
  width: 36px; height: 36px; display: grid; place-items: center;
  border: 1px solid var(--line-strong); border-radius: 8px;
  color: var(--accent); font-weight: 700; font-size: 12px; margin-bottom: 18px;
}
.bk-sidebar-header-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.bk-icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--muted);
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}
.bk-icon-btn:hover,
.bk-icon-btn[aria-expanded="true"] {
  transform: translateY(-1px);
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}
.bk-sidebar-expand {
  position: fixed;
  top: 24px;
  left: 24px;
  width: 40px;
  height: 40px;
  display: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--muted);
  cursor: pointer;
  z-index: 100;
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
}
.bk-shell[data-collapsed="true"] .bk-sidebar-expand {
  display: grid;
}
.bk-sidebar-expand:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

.bk-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  margin-bottom: 12px;
  transition: color 0.18s ease;
}
.bk-back-link:hover {
  color: var(--ink);
}
.bk-sidebar-footer {
  margin-top: auto;
  padding: 24px 22px 0;
  border-top: 1px solid var(--line);
  position: relative;
}


.bk-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.bk-sidebar-title { font-weight: 700; font-size: 15px; line-height: 1.35; color: var(--ink); }
.bk-sidebar-author { font-size: 12px; color: var(--muted); margin-top: 6px; }
.bk-tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
.bk-tag-row span {
  font-size: 11px; color: var(--muted); border: 1px solid var(--line);
  border-radius: 999px; padding: 3px 8px; background: var(--panel);
}
.bk-theme-panel {
  position: absolute;
  z-index: 20;
  left: 22px;
  bottom: 64px;
  width: min(240px, calc(100vw - 36px));
  display: grid; gap: 8px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  box-shadow: var(--shadow);
}
.bk-theme-panel[hidden] {
  display: none;
}
.bk-theme-panel label { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 8px; }
.bk-theme-panel span { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.bk-theme-panel select {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  padding: 6px 8px;
}

.bk-nav { display: flex; flex-direction: column; gap: 4px; padding: 0 16px; }
.bk-nav-item {
  display: block; padding: 9px 10px 9px 14px;
  font-size: 13px; line-height: 1.35;
  color: var(--muted);
  text-decoration: none;
  border-radius: 8px;
  border-left: 2px solid transparent;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.bk-nav-item:hover { color: var(--ink); background: var(--panel); }
.bk-nav-item.active { color: var(--accent); background: var(--accent-soft); border-left-color: var(--accent); font-weight: 600; }
.bk-nav-sub { padding-left: 24px; font-size: 13.5px; }
.bk-nav-quiz { font-style: italic; opacity: 0.8; }

.bk-main { min-width: 0; }
.bk-content {
  max-width: 1024px;
  margin: 0 auto;
  padding: 56px 34px 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}
.bk-content > * {
  width: 100%;
  max-width: 720px;
}
.bk-content > .bk-object,
.bk-content > .bk-end-nav {
  max-width: 100%;
}
.bk-density-compact .bk-content { gap: 22px; }

.bk-hero {
  border-bottom: 1px solid var(--line);
  padding: 18px 0 44px;
  margin-bottom: 4px;
}
.bk-eyebrow {
  color: var(--accent); font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 18px;
}
.bk-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(38px, 6vw, 66px);
  line-height: 1.02;
  letter-spacing: 0;
  max-width: 780px;
  margin: 0;
}
.bk-deck {
  max-width: 660px;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.65;
  margin-top: 22px;
}


.bk-markdown h1, .bk-section h1, .bk-section h2 {
  font-family: var(--font-display);
  font-size: 34px; font-weight: 700; letter-spacing: 0;
  margin: 16px 0 24px; line-height: 1.2;
}
.bk-section.bk-heading { margin-top: 24px; }
.bk-section.bk-subsection { margin-top: 16px; }
.bk-markdown h2, .bk-section h3 { font-size: 23px; font-weight: 650; margin: 32px 0 16px; letter-spacing: 0; }
.bk-markdown h3, .bk-section h4 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; }

p { margin-bottom: 16px; color: var(--ink); font-size: 18px; }
ul, ol { padding-left: 24px; margin-bottom: 16px; color: var(--ink); }
li { margin-bottom: 8px; }
li > p { margin-bottom: 8px; }
strong { font-weight: 600; }
a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
a:hover { border-color: var(--accent); }

code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 0.2em 0.4em;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
}

blockquote {
  border-left: 4px solid var(--line-strong);
  padding: 4px 0 4px 20px;
  margin: 24px 0;
  color: var(--muted);
  font-style: italic;
}

.bk-math-block { margin: 24px 0; overflow-x: auto; overflow-y: hidden; display: flex; justify-content: center; }
hr.bk-divider {
  border: none; border-top: 1px solid var(--line);
  margin: 48px auto; width: 50%;
}

.bk-callout {
  display: flex; gap: 16px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid;
  margin: 24px 0;
  background: var(--panel);
  border-color: var(--line);
}
.bk-callout-icon {
  flex-shrink: 0; width: 24px; height: 24px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 14px; color: #fff;
}
.bk-callout-content { flex-grow: 1; }
.bk-callout-label { font-weight: 600; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
.bk-callout-body > *:last-child { margin-bottom: 0; }

.bk-callout--note .bk-callout-icon { background: var(--muted); }
.bk-callout--note .bk-callout-icon::after { content: "i"; }
.bk-callout--note .bk-callout-label { color: var(--muted); }

.bk-callout--tip { background: color-mix(in srgb, var(--teal) 12%, var(--paper)); border-color: color-mix(in srgb, var(--teal) 32%, var(--line)); }
.bk-callout--tip .bk-callout-icon { background: var(--teal); }
.bk-callout--tip .bk-callout-icon::after { content: "OK"; font-size: 9px; }
.bk-callout--tip .bk-callout-label { color: var(--teal); }

.bk-callout--important { background: color-mix(in srgb, var(--blue) 12%, var(--paper)); border-color: color-mix(in srgb, var(--blue) 32%, var(--line)); }
.bk-callout--important .bk-callout-icon { background: var(--blue); }
.bk-callout--important .bk-callout-icon::after { content: "!"; }
.bk-callout--important .bk-callout-label { color: var(--blue); }

.bk-callout--warning { background: color-mix(in srgb, var(--amber) 14%, var(--paper)); border-color: color-mix(in srgb, var(--amber) 36%, var(--line)); }
.bk-callout--warning .bk-callout-icon { background: var(--amber); }
.bk-callout--warning .bk-callout-icon::after { content: "!"; }
.bk-callout--warning .bk-callout-label { color: var(--amber); }


.bk-code-block {
  margin: 24px 0;
  border-radius: 8px;
  background: var(--code-bg);
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.bk-code-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-family: var(--font-mono); font-size: 12px; color: #a1a1aa;
}
.bk-code-lang { text-transform: uppercase; }
.bk-code-scroll { padding: 20px; overflow-x: auto; }
.bk-code-block pre { margin: 0; background: transparent; border: none; padding: 0; }
.bk-code-block code { background: transparent; border: none; padding: 0; color: var(--text-code); font-size: 14px; }


.bk-object {
  margin: 34px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.bk-object:focus-within {
  border-color: var(--object-accent, var(--accent));
}
.bk-object-header {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(90deg, color-mix(in srgb, var(--object-accent, var(--accent)) 12%, var(--paper)), var(--paper));
}
.bk-object-kicker {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--object-accent, var(--accent));
}
.bk-object-title { font-size: 13px; color: var(--muted); font-weight: 600; }
.bk-object-maximize {
  margin-left: auto; width: 28px; height: 28px;
  display: grid; place-items: center; border: none; background: transparent;
  color: var(--muted); cursor: pointer; border-radius: 4px;
}
.bk-object-maximize:hover { background: rgba(0,0,0,0.05); color: var(--ink); }
@media (prefers-color-scheme: dark) { .bk-object-maximize:hover { background: rgba(255,255,255,0.1); } }
.bk-object--maximized {
  position: fixed; inset: 0; width: 100vw; height: 100vh;
  z-index: 1000; margin: 0; border: none; border-radius: 0;
  display: flex; flex-direction: column;
}
.bk-object--maximized .bk-embed-frame,
.bk-object--maximized .bk-media,
.bk-object--maximized .bk-code-block {
  flex-grow: 1; height: auto !important; max-height: none !important;
}
.bk-object--maximized .bk-caption { margin-top: auto; }
.bk-object--maximized .bk-embed-interactive iframe { pointer-events: auto !important; }
.bk-object--maximized .bk-embed-overlay { display: none !important; }
.bk-object--blue { --object-accent: var(--blue); }
.bk-object--teal { --object-accent: var(--teal); }
.bk-object--amber { --object-accent: var(--amber); }
.bk-object--rose { --object-accent: var(--rose); }
.bk-object--violet { --object-accent: var(--violet); }
.bk-embed-frame { background: #0d1116; position: relative; width: 100%; }
.bk-embed-interactive iframe { pointer-events: none; transition: opacity 0.2s; }
.bk-embed-interactive.is-interactive iframe { pointer-events: auto; }
.bk-embed-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
  cursor: pointer; transition: opacity 0.2s, visibility 0.2s;
}
.bk-embed-overlay:hover, .bk-embed-overlay:focus { background: rgba(0, 0, 0, 0.3); outline: none; }
.bk-embed-overlay-text {
  padding: 8px 16px; background: rgba(0, 0, 0, 0.6); color: #fff;
  border-radius: 99px; font-size: 13px; font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  transition: transform 0.2s;
}
.bk-embed-overlay:hover .bk-embed-overlay-text, .bk-embed-overlay:focus .bk-embed-overlay-text { transform: scale(1.05); }
.bk-embed-interactive.is-interactive .bk-embed-overlay { opacity: 0; visibility: hidden; pointer-events: none; }
.bk-sim-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}
.bk-sim-toggle, .bk-sim-range {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}
.bk-sim-toggle {
  grid-template-columns: auto 1fr;
  align-items: center;
}
.bk-sim-range {
  grid-template-columns: 1fr auto;
  align-items: center;
}
.bk-sim-range input { grid-column: 1 / -1; width: 100%; accent-color: var(--accent); }
.bk-sim-toggle input { accent-color: var(--accent); }
.bk-sim-toggle input,
.bk-sim-range input {
  cursor: pointer;
}
.bk-sim-range output {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.bk-media { background: var(--panel); display: grid; place-items: center; }
.bk-media img, .bk-media video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bk-media--audio { padding: 24px; }
.bk-media audio { width: 100%; }
.bk-aspect-wide { aspect-ratio: 16 / 9; }
.bk-aspect-standard { aspect-ratio: 4 / 3; }
.bk-aspect-square { aspect-ratio: 1 / 1; }
.bk-aspect-auto { min-height: 0; }
.bk-caption {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  background: var(--panel);
}
.bk-caption * { font-size: inherit; margin: 0; }
.bk-latex-block { display: flex; justify-content: center; overflow-x: auto; padding: 28px 18px; background: var(--paper); }
.bk-latex-inline { padding: 16px; background: var(--paper); }
.bk-columns {
  display: grid;
  gap: 18px;
  padding: 18px;
  background: var(--paper);
}
.bk-column {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
.bk-column > *:last-child { margin-bottom: 0; }

.bk-quiz {
  margin: 32px 0;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--paper);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.bk-quiz-head {
  display: flex; flex-direction: column; gap: 4px;
  padding: 16px 22px;
  font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--accent);
  border-bottom: 1px solid var(--line);
  background: var(--accent-soft);
}
.bk-quiz-head small { color: var(--muted); text-transform: none; letter-spacing: 0; font-weight: 500; }
.bk-question { padding: 24px; border-bottom: 1px solid var(--line); }
.bk-question:last-child { border-bottom: none; }
.bk-q-text { font-size: 16px; font-weight: 500; margin-bottom: 20px; }
.bk-q-text > *:last-child { margin-bottom: 0; }
.bk-opts { display: flex; flex-direction: column; gap: 12px; }
.bk-opt {
  display: flex; align-items: center; gap: 16px;
  width: 100%; text-align: left;
  padding: 14px 16px;
  border-radius: 8px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink);
  font-size: 15px; cursor: pointer; transition: all 0.2s;
}
.bk-opt:hover { border-color: var(--line-strong); background: var(--panel); }
.bk-opt-dot {
  width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--muted);
  flex-shrink: 0; transition: all 0.2s;
}

.bk-opt.correct {
  background: var(--correct-bg); border-color: var(--correct-line);
  pointer-events: none;
}
.bk-opt.correct .bk-opt-dot { border-color: var(--correct-line); background: var(--correct-line); }

.bk-opt.wrong {
  background: var(--wrong-bg); border-color: var(--wrong-line);
  pointer-events: none; opacity: 0.8;
}
.bk-opt.wrong .bk-opt-dot { border-color: var(--wrong-line); background: var(--wrong-line); }

.bk-opt.disabled { opacity: 0.5; pointer-events: none; }

.bk-explanation {
  margin-top: 20px; padding: 16px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; color: var(--muted);
}
.bk-explanation > *:last-child { margin-bottom: 0; }

.bk-end-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}
.bk-end-link {
  min-height: 100px;
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  text-decoration: none;
}
.bk-end-link:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.bk-end-link span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.bk-end-link strong {
  line-height: 1.25;
}
.bk-end-link--next {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 36%, var(--line));
}

@media(max-width: 800px) {
  .bk-shell { display: block; }
  .bk-sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--line); }
  .bk-sidebar-inner { padding: 20px; }
  .bk-sidebar-header { padding-left: 0; padding-right: 0; }
  .bk-settings-button { right: 0; }
  .bk-theme-panel { right: 0; }
  .bk-nav { padding: 0; max-height: 190px; overflow-y: auto; }
  .bk-content { padding: 32px 20px 80px; }
  .bk-hero h1 { font-size: 38px; }
  .bk-home { grid-template-columns: 1fr; }
  .bk-home-grid { grid-template-columns: 1fr; }
  .bk-end-nav { grid-template-columns: 1fr; }
  .bk-object-header, .bk-quiz-head { padding-left: 14px; padding-right: 14px; }
  .bk-columns { grid-template-columns: 1fr !important; }
}
`;
}

// ─── Client-side script ───────────────────────────────────────────────────────

function clientScript(): string {
	return `
function bkSimDoc(js, props, loop) {
  return '<!DOCTYPE html><html><head><style>' +
    'html,body{height:100%;width:100%;margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center}' +
    'canvas{display:block;touch-action:none;transform-origin:center center}' +
    'body{background:#fff;color:#111;font-family:sans-serif}' +
    '@media (prefers-color-scheme: dark){body{background:#0a0a0a;color:#eee}}' +
    '</style></head><body><canvas id="c" width="800" height="500"></canvas><script>' +
    'window.__simProps=' + JSON.stringify(props) + ';window.__loop=' + JSON.stringify(Boolean(loop)) + ';' +
    'window.bkSetup=function(w,h,f){const c=document.getElementById("c");if(!c)return;const ctx=c.getContext("2d");window.parent.postMessage({type:"bk:aspect",aspect:w/h},"*");function l(){const s=Math.max(window.innerWidth/w,window.innerHeight/h),d=window.devicePixelRatio||1,b=s*d,nw=Math.floor(w*b),nh=Math.floor(h*b);if(c.width!==nw||c.height!==nh){c.width=nw;c.height=nh;c.style.width=w+"px";c.style.height=h+"px";c.style.transform="scale("+s+")"}ctx.save();ctx.scale(b,b);f(ctx,w,h);ctx.restore();requestAnimationFrame(l)}l()};' +
    'window.addEventListener("message",function(event){if(!event.data||event.data.type!=="bk:set-props")return;window.__simProps=Object.assign({},window.__simProps,event.data.props);window.dispatchEvent(new CustomEvent("bk:props",{detail:window.__simProps}));});' +
    'try{' + js + '}catch(e){console.error("Simulation Error:",e);document.body.innerHTML="<div style=\\'padding:20px;color:red;font-family:monospace\\'>Error: "+e.message+"</div>"}' +
    '<\\/script></body></html>'
}

function bkReadSimProps(figure) {
  const props = {}
  figure.querySelectorAll('[data-bk-prop]').forEach(input => {
    if (input.type === 'checkbox') {
      props[input.dataset.bkProp] = input.checked
    } else if (input.type === 'range' || input.type === 'number') {
      props[input.dataset.bkProp] = Number(input.value)
      const output = input.parentElement && input.parentElement.querySelector('output')
      if (output) output.textContent = input.value
    } else {
      props[input.dataset.bkProp] = input.value
    }
  })
  return props
}

function bkRestartSim(iframe, config, props) {
  iframe.srcdoc = bkSimDoc(config.js, props, config.loop)
}

function bkWireSimControls() {
  document.querySelectorAll('.bk-object').forEach(figure => {
    const configEl = figure.querySelector('.bk-sim-config')
    const iframe = figure.querySelector('iframe')
    if (!configEl || !iframe) return

    let config
    try { config = JSON.parse(configEl.textContent || '{}') } catch { return }

    let timer = null
    figure.querySelectorAll('[data-bk-prop]').forEach(input => {
      input.addEventListener('input', () => {
        const props = bkReadSimProps(figure)
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'bk:set-props', props }, '*')
        clearTimeout(timer)
        timer = setTimeout(() => bkRestartSim(iframe, config, props), 90)
      })
      input.addEventListener('change', () => {
        const props = bkReadSimProps(figure)
        clearTimeout(timer)
        bkRestartSim(iframe, config, props)
      })
    })
  })

  window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "bk:aspect") {
      document.querySelectorAll("iframe").forEach(iframe => {
        if (iframe.contentWindow === event.source) {
          if (iframe.parentElement && iframe.parentElement.classList.contains("bk-embed-frame")) {
            iframe.parentElement.style.aspectRatio = event.data.aspect;
          }
        }
      });
    }
  });
}

function bkWireMaximizeControls() {
  document.querySelectorAll('.bk-object-maximize').forEach(btn => {
    btn.addEventListener('click', () => {
      const obj = btn.closest('.bk-object');
      if (!obj) return;
      const isMax = obj.classList.toggle('bk-object--maximized');
      if (isMax) {
        document.body.style.overflow = 'hidden';
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
      } else {
        document.body.style.overflow = '';
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
      }
    });
  });
}

function bkWireInteractiveFrames() {
  document.querySelectorAll('.bk-object').forEach(obj => {
    const activate = () => {
      const frame = obj.querySelector('.bk-embed-interactive');
      if (frame) frame.classList.add('is-interactive');
    };
    obj.addEventListener('pointerdown', activate, { passive: true });
    obj.addEventListener('focusin', activate, { passive: true });
  });

  const exitInteractive = (e) => {
    document.querySelectorAll('.bk-embed-interactive.is-interactive').forEach(frame => {
      const container = frame.closest('.bk-object') || frame;
      if (!container.contains(e.target)) {
        frame.classList.remove('is-interactive');
      }
    });
  };
  document.addEventListener('pointerdown', exitInteractive, { passive: true });
  document.addEventListener('focusin', exitInteractive, { passive: true });
}

function bkWireSidebarToggle() {
  const shell = document.querySelector('.bk-shell')
  const collapseBtn = document.getElementById('bk-sidebar-collapse')
  const expandBtn = document.getElementById('bk-sidebar-expand')
  if (collapseBtn) collapseBtn.addEventListener('click', () => shell.setAttribute('data-collapsed', 'true'))
  if (expandBtn) expandBtn.addEventListener('click', () => shell.removeAttribute('data-collapsed'))
}

function bkWireThemeControls() {
  const root = document.documentElement
  const button = document.getElementById('bk-settings-button')
  const panel = document.getElementById('bk-theme-panel')
  const theme = document.getElementById('bk-theme-select')
  const palette = document.getElementById('bk-palette-select')
  const savedTheme = localStorage.getItem('bk-theme')
  const savedPalette = localStorage.getItem('bk-palette')

  if (savedTheme && theme) {
    theme.value = savedTheme
    savedTheme === 'auto' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', savedTheme)
  }
  if (savedPalette && palette) {
    const normalizedPalette = savedPalette === 'green' ? 'field' : savedPalette
    palette.value = normalizedPalette
    root.setAttribute('data-palette', normalizedPalette)
  }

  button && panel && button.addEventListener('click', event => {
    event.stopPropagation()
    const open = panel.hasAttribute('hidden')
    panel.hidden = !open
    button.setAttribute('aria-expanded', String(open))
  })

  panel && panel.addEventListener('click', event => event.stopPropagation())
  document.addEventListener('click', () => {
    if (!button || !panel || panel.hidden) return
    panel.hidden = true
    button.setAttribute('aria-expanded', 'false')
  })
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !button || !panel || panel.hidden) return
    panel.hidden = true
    button.setAttribute('aria-expanded', 'false')
    button.focus()
  })

  theme && theme.addEventListener('change', () => {
    localStorage.setItem('bk-theme', theme.value)
    theme.value === 'auto' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', theme.value)
  })
  palette && palette.addEventListener('change', () => {
    localStorage.setItem('bk-palette', palette.value)
    root.setAttribute('data-palette', palette.value)
  })
}

// Quiz interaction
function bkAnswer(btn, qid) {
  const isCorrect = btn.dataset.correct === 'true'
  const question = document.getElementById(qid)
  question.querySelectorAll('.bk-opt').forEach(b => {
    if (b.dataset.correct === 'true') {
      b.classList.add('correct')
    } else if (b === btn) {
      b.classList.add('wrong')
    } else {
      b.classList.add('disabled')
    }
  })
  const exp = document.getElementById(qid + '-exp')
  if (exp) exp.hidden = false
}

// Active sidebar link on scroll
document.addEventListener('DOMContentLoaded', () => {
  bkWireMaximizeControls()
  bkWireSidebarToggle()
  bkWireThemeControls()
  bkWireSimControls()
  bkWireInteractiveFrames()

  const sections = document.querySelectorAll('[id^="heading-"], [id^="section-"], [id^="quiz-"]')
  const navLinks = document.querySelectorAll('.bk-nav-item')

  if (!sections.length || !navLinks.length) return

  const obs = new IntersectionObserver(entries => {
    let activeId = null
    entries.forEach(e => {
      if (e.isIntersecting) {
        activeId = e.target.id
      }
    })

    if (activeId) {
      navLinks.forEach(l => {
        if (l.dataset.id === activeId) {
          l.classList.add('active')
        } else {
          l.classList.remove('active')
        }
      })
    }
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 })

  sections.forEach(s => obs.observe(s))
})
`;
}

// ─── Main render function ─────────────────────────────────────────────────────

export function render(lesson: Lesson, opts: BuildOptions = {}): string {
	const bodyItems: string[] = [];
	const structuredNavItems: NavItem[] = [];

	lesson.blocks.forEach((block, idx) => {
		const { html, navItem } = renderBlock(block, idx, opts);
		bodyItems.push(html);
		if (navItem) {
			structuredNavItems.push(navItem);
		}
	});

	return renderPage(lesson, structuredNavItems, bodyItems.join("\n"), opts);
}

// ─── Chapter Rendering ────────────────────────────────────────────────────────

export function renderChapter(chapter: Chapter, opts: BuildOptions = {}): string {
	const theme = opts.theme ?? "auto";
	const schemeAttr = theme === "auto" ? "" : `data-theme="${theme}"`;
	const preset = opts.preset ?? {};
	const layout = preset.layout ?? "lesson";
	const density = preset.density ?? "comfortable";
	const tone = preset.tone ?? "scholarly";
	const palette = opts.palette ?? "ink";

	const navHtml = chapter.lessons.map(l => `<a href="${escAttr(l.meta.slug)}.html" class="bk-nav-item bk-nav-chapter">${escHtml(l.meta.title)}</a>`).join("\n");

	const timelineHtml = `
<div class="bk-chapter-timeline">
  ${chapter.lessons.map((lesson, idx) => `
    <a href="${escAttr(lesson.meta.slug)}.html" class="bk-timeline-card bk-status-${lesson.meta.status ?? 'unread'}" style="animation-delay: ${idx * 0.1}s">
      <div class="bk-timeline-node"></div>
      <div class="bk-timeline-content">
        <h3 class="bk-timeline-title">${escHtml(lesson.meta.title)}</h3>
        ${lesson.meta.description ? `<p class="bk-timeline-desc">${escHtml(lesson.meta.description)}</p>` : ''}
        <span class="bk-timeline-action">${lesson.meta.status === 'read' ? 'Read again' : 'Start Lesson'} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></span>
      </div>
    </a>
  `).join("")}
</div>`;

	const chapterStyles = `
.bk-chapter-timeline {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 3rem 0;
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}
.bk-chapter-timeline::before {
  content: '';
  position: absolute;
  left: 24px; /* center of the 48px node */
  top: 3rem;
  bottom: 3rem;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(to bottom, var(--accent) 0%, var(--accent-soft) 100%);
  z-index: 0;
  transform: translateX(-50%);
  opacity: 0.5;
}
.bk-timeline-card {
  display: flex;
  align-items: stretch;
  gap: 2rem;
  text-decoration: none !important;
  border: none !important;
  color: inherit;
  position: relative;
  z-index: 1;
  opacity: 0;
  animation: bk-fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.bk-timeline-node {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--paper) 0%, var(--panel) 100%);
  border: 3px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.5);
}
.bk-timeline-node::after {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--accent) 40%, transparent);
}
.bk-timeline-card:hover .bk-timeline-node {
  background: var(--accent-soft);
  transform: scale(1.05);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 15%, transparent);
}
.bk-timeline-card:hover .bk-timeline-node::after {
  transform: scale(1.15);
}
.bk-timeline-content {
  background: linear-gradient(145deg, var(--paper) 0%, var(--panel) 100%);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  flex: 1;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.bk-timeline-content::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.bk-timeline-card:hover .bk-timeline-content {
  border-color: var(--accent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--accent) 10%, transparent);
  transform: translateY(-2px);
}
.bk-timeline-card:hover .bk-timeline-content::before {
  opacity: 1;
}
.bk-timeline-title {
  margin: 0 0 0.75rem 0;
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--ink);
  transition: color 0.2s;
}
.bk-timeline-card:hover .bk-timeline-title {
  color: var(--accent);
}
.bk-timeline-desc {
  margin: 0 0 1.5rem 0;
  color: var(--muted);
  line-height: 1.6;
  font-size: 1.05rem;
}
.bk-timeline-action {
  font-weight: 600;
  color: var(--paper);
  background: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  align-self: flex-start;
  transition: all 0.2s;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent);
}
.bk-timeline-card:hover .bk-timeline-action {
  gap: 0.75rem;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 85%, black);
}
@keyframes bk-fade-in-up {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.bk-status-unread .bk-timeline-node {
  border-color: var(--line-strong);
  box-shadow: none;
  background: var(--surface);
}
.bk-status-unread .bk-timeline-node::after {
  background: var(--muted);
  box-shadow: none;
  transform: scale(0.8);
}
.bk-status-unread .bk-timeline-content {
  background: var(--surface);
  box-shadow: none;
}
.bk-status-unread .bk-timeline-content::before {
  display: none;
}
.bk-status-unread .bk-timeline-title {
  color: var(--muted);
}
.bk-status-unread .bk-timeline-desc {
  color: color-mix(in srgb, var(--muted) 70%, transparent);
}
.bk-status-unread .bk-timeline-action {
  background: var(--paper);
  color: var(--muted);
  box-shadow: none;
  border: 1px solid var(--line-strong);
}
.bk-status-unread:hover .bk-timeline-node {
  border-color: var(--muted);
  background: var(--paper);
}
.bk-status-unread:hover .bk-timeline-node::after {
  background: var(--ink);
  transform: scale(1);
}
.bk-status-unread:hover .bk-timeline-content {
  background: var(--paper);
  box-shadow: 0 8px 24px rgba(0,0,0,0.05);
}
.bk-status-unread:hover .bk-timeline-title {
  color: var(--ink);
}
.bk-status-unread:hover .bk-timeline-action {
  background: var(--line);
  color: var(--ink);
  border-color: transparent;
}

@media (prefers-color-scheme: dark) {
  .bk-chapter-timeline::before {
    opacity: 0.2;
  }
  .bk-timeline-node {
    background: linear-gradient(135deg, var(--panel) 0%, var(--panel-strong) 100%);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .bk-timeline-content {
    background: linear-gradient(145deg, var(--panel) 0%, var(--panel-strong) 100%);
  }
  .bk-timeline-card:hover .bk-timeline-content {
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  }
}
@media (max-width: 600px) {
  .bk-chapter-timeline::before {
    left: 20px;
  }
  .bk-timeline-node {
    width: 40px;
    height: 40px;
  }
  .bk-timeline-node::after {
    width: 12px;
    height: 12px;
  }
  .bk-timeline-content {
    padding: 1.5rem;
  }
}
`;

	return `<!DOCTYPE html>
<html lang="en" data-palette="${palette}" ${schemeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(chapter.meta.title)}</title>
${chapter.meta.description ? `<meta name="description" content="${escHtml(chapter.meta.description)}">` : ""}
${opts.head ?? ""}
<style>
${opts.font ? `:root { --font-sans: ${opts.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }` : ""}
${pageCSS()}
${chapterStyles}
</style>
</head>
<body class="bk-layout-${layout} bk-density-${density} bk-tone-${tone}">
<div class="bk-shell">
  <aside class="bk-sidebar">
    <div class="bk-sidebar-inner">
      <div class="bk-sidebar-header">
        <div class="bk-sidebar-header-top">
          <div style="flex-grow: 1;"></div>
          <button class="bk-icon-btn bk-sidebar-collapse" id="bk-sidebar-collapse" type="button" aria-label="Collapse sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M9 3v18"/><path d="M14 15l-3-3 3-3"/></svg>
          </button>
        </div>
        <div class="bk-sidebar-title">${escHtml(chapter.meta.title)}</div>
      </div>
      <nav class="bk-nav">${navHtml}</nav>
      <div class="bk-sidebar-footer">
        <button class="bk-icon-btn bk-settings-button" id="bk-settings-button" type="button" aria-expanded="false" aria-controls="bk-theme-panel" title="Display settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="bk-sr-only">Display settings</span>
        </button>
        <div class="bk-theme-panel" id="bk-theme-panel" aria-label="Display settings" hidden>
          <label>
            <span>Theme</span>
            <select id="bk-theme-select">
              <option value="auto" ${theme === "auto" ? "selected" : ""}>System</option>
              <option value="light" ${theme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${theme === "dark" ? "selected" : ""}>Dark</option>
            </select>
          </label>
          <label>
            <span>Palette</span>
            <select id="bk-palette-select">
              <option value="ink" ${palette === "ink" ? "selected" : ""}>Ink</option>
              <option value="field" ${palette === "field" ? "selected" : ""}>Field</option>
              <option value="ember" ${palette === "ember" ? "selected" : ""}>Ember</option>
            </select>
          </label>
        </div>
      </div>
      <nav class="bk-nav">${navHtml}</nav>
    </div>
  </aside>
  <main class="bk-main">
    <button class="bk-sidebar-expand" id="bk-sidebar-expand" type="button" aria-label="Expand sidebar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <article class="bk-content" style="max-width: 1000px; margin: 0 auto;">
      <header class="bk-hero" style="border-bottom: none;">
        <p class="bk-eyebrow">Chapter</p>
        <h1>${escHtml(chapter.meta.title)}</h1>
        ${chapter.meta.description ? `<p class="bk-deck">${escHtml(chapter.meta.description)}</p>` : ""}
      </header>
      ${timelineHtml}
    </article>
  </main>
</div>
<script>
${clientScript()}
</script>
</body>
</html>`;
}

