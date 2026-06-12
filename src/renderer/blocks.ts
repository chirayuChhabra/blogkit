import katex from "katex";
import type { Block, BuildOptions, QuizFile, QuizQuestion } from "../types.js";
import {
	blockChrome,
	escapeScriptJson,
	mdInline,
	mdToHtml,
	renderSimulationControls,
} from "./markdown.js";
import hljs from "highlight.js";
import { type NavItem, resolveAssetSrc, resolveContent } from "./utils.js";

// HTML escaping utility needed by blocks
export function escHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
export function escAttr(str: string): string {
	return escHtml(str);
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function renderBlock(
	block: Block,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	try {
		const result = renderBlockInner(block, idx, options);
		if (
			result.html &&
			"src" in block &&
			typeof block.src === "string" &&
			block.src.includes(".")
		) {
			result.html = result.html.replace(
				/^<([a-zA-Z0-9-]+)([^>]*)>/,
				`<$1 data-bk-src="${escAttr(block.src)}"$2>`,
			);
		}
		return result;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.warn(
			`  ⚠ Error rendering block ${idx + 1} (${block.type}): ${msg}`,
		);
		const errorHtml = `<div class="bk-callout bk-callout--warning"><div class="bk-callout-icon"></div><div class="bk-callout-content"><div class="bk-callout-label">Block Error (${escHtml(block.type)})</div><div class="bk-callout-body"><p>${escHtml(msg)}</p></div></div></div>`;
		return { html: errorHtml };
	}
}

function renderBlockInner(
	block: Block,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	switch (block.type) {
		case "heading": {
			const md = resolveContent(block.src, options, "md");
			const { html, title } = mdToHtml(md);
			const label = block.title || title || (typeof block.src === "string" && !block.src.includes(".md") ? block.src : "Heading");
			const id = `heading-${idx}`;
			return {
				html: `<section id="${id}" class="bk-section bk-heading">${html}</section>`,
				navItems: [{ id, label, kind: "heading" }],
			};
		}

		case "markdown": {
			const md = resolveContent(block.src, options, "md");
			const { html, headings } = mdToHtml(md);
			const navItems: NavItem[] = headings.map(h => ({
				id: h.id,
				label: h.text,
				kind: h.level === 1 ? "heading" : "section"
			}));
			return { html: `<div class="bk-markdown">${html}</div>`, navItems: navItems.length > 0 ? navItems : undefined };
		}

		case "section": {
			const md = resolveContent(block.src, options, "md");
			const { html, title } = mdToHtml(md);
			const label = block.label || title || (typeof block.src === "string" && !block.src.includes(".md") ? block.src : "Section");
			const id = `section-${idx}`;
			return {
				html: `<section id="${id}" class="bk-section bk-subsection">${html}</section>`,
				navItems: [{ id, label, kind: "section" }],
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
			const isInlineCode = typeof block.src === "string" && (block.src.includes("\n") || block.src.includes(" "));
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

		case "simulation": {
			const propsJson = escapeScriptJson(block.props ?? {});
			const simSrc = resolveContent(block.src, options, "js");
			const simConfig = { js: simSrc, loop: false, dependencies: block.dependencies };
			const id = `sim-${idx}`;
			const label = block.label || "Interactive Simulation";
			return {
				html: blockChrome(
					block.controls === "observe" ? "Simulation" : "Interactive Lab",
					block.label,
					block.caption,
					`${renderSimulationControls(block as Extract<Block, { type: "simulation" }>)}
          <div class="bk-embed-frame bk-embed-interactive">
            <div class="bk-embed-overlay" tabindex="0" role="button" aria-label="Activate interactive simulation">
              <span class="bk-embed-overlay-text">Click to interact</span>
            </div>
            <iframe srcdoc="${iframeDoc(simSrc, propsJson, false, block.dependencies)}"
              sandbox="allow-scripts"
              loading="lazy"
              style="width:100%;height:100%;border:none;display:block;">
            </iframe>
          </div>
          <script type="application/json" class="bk-sim-config">${escapeScriptJson(simConfig)}</script>`,
					block.accent ?? "blue",
					true,
					id
				),
				navItems: [{ id, label, kind: "simulation" }],
			};
		}

		case "animation": {
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

		case "media": {
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

		case "youtube": {
			const params = new URLSearchParams();
			params.set("rel", "0");
			if (block.start) params.set("start", String(block.start));
			return {
				html: blockChrome(
					"YouTube",
					block.label,
					block.caption,
					`<div class="bk-embed-frame">
            <iframe src="https://www.youtube-nocookie.com/embed/${escAttr(block.id)}?${params.toString()}"
              title="${escAttr(block.label ?? "YouTube video")}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
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
					false
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
					false
				),
			};
		}

		case "quiz": {
			let quiz: QuizFile = { questions: [] };
			const rawJson = resolveContent(block.src, options, "json");
			try {
				const trimmed = rawJson.trim();
				if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
					throw new Error("Quiz file not found or invalid JSON format");
				}
				quiz = JSON.parse(trimmed);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (options.strict !== false) {
					throw new Error(`Invalid Quiz JSON for block ${idx + 1}: ${msg}`);
				}
				console.warn(`  ⚠ Invalid Quiz JSON for block ${idx + 1}:`, e);
				return {
					html: `<div class="bk-callout bk-callout--warning"><div class="bk-callout-icon"></div><div class="bk-callout-content"><div class="bk-callout-label">Quiz JSON Error</div><div class="bk-callout-body"><p>${escHtml(msg)}</p></div></div></div>`,
				};
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
				navItems: [{
					id: `quiz-${idx}`,
					label: block.label ?? "Questions",
					kind: "quiz",
				}],
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
function iframeDoc(js: string, props: string, loop?: boolean, dependencies?: string[]): string {
	const scriptTags = (dependencies ?? []).map((url) => `<script src="${escAttr(url)}"></script>`).join("\\n");
	const doc = `<!DOCTYPE html><html><head>
${scriptTags}
<style>
  html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
  canvas { display: block; touch-action: none; transform-origin: center center; flex-shrink: 0; }
  body { font-family: sans-serif; }
</style>
</head><body>
<canvas id="c" width="800" height="500"></canvas>
<script>
window.__simProps=${props};
window.__loop=${loop ?? false};
window.bkSetupCalled = false;
window.bkCanvasPoint = function(event, canvas) {
  const c = canvas || event.currentTarget || event.target;
  const rect = c.getBoundingClientRect();
  const logicalW = c.__bkLogicalW || 800;
  const logicalH = c.__bkLogicalH || 500;
  return {
    x: (event.clientX - rect.left) * logicalW / rect.width,
    y: (event.clientY - rect.top) * logicalH / rect.height
  };
};
window.bkFitCanvas = function(c, requestedW, requestedH, options) {
  if (!c) return { scale: 1, width: requestedW, height: requestedH, cssScale: 1 };
  const dpr = window.devicePixelRatio || 1;
  const w = requestedW;
  const h = requestedH;
  
  c.__bkLogicalW = w;
  c.__bkLogicalH = h;
  
  c.style.width = w + "px";
  c.style.height = h + "px";
  
  c.style.position = "relative";
  c.style.left = "auto";
  c.style.top = "auto";
  c.style.transformOrigin = "center center";
  
  const scaleX = window.innerWidth / w;
  const scaleY = window.innerHeight / h;
  const cssScale = Math.max(scaleX, scaleY);
  
  c.style.transform = "scale(" + cssScale + ")";
  
  const physW = Math.max(1, Math.round(w * dpr));
  const physH = Math.max(1, Math.round(h * dpr));

  if (!options || options.bitmap !== false) {
    if (c.width !== physW || c.height !== physH) {
      c.width = physW;
      c.height = physH;
    }
  }
  return { scale: dpr, width: w, height: h, cssScale };
};
window.bkSetup = function(requestedW, requestedH, loopFn) {
  window.bkSetupCalled = true;
  const canvas = document.getElementById("c");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  let loopId = null;
  let cachedFit = window.bkFitCanvas(canvas, requestedW, requestedH);

  function loop() {
    if (window.innerWidth >= 32 && window.innerHeight >= 32) {
      ctx.save();
      ctx.scale(cachedFit.scale, cachedFit.scale);
      
      loopFn(ctx, cachedFit.width, cachedFit.height);
      
      ctx.restore();
    }
    if (window.__loop) {
      loopId = requestAnimationFrame(loop);
    } else {
      loopId = null;
    }
  }
  
  function initDraw() {
    if (window.innerWidth >= 32 && window.innerHeight >= 32) {
      cachedFit = window.bkFitCanvas(canvas, requestedW, requestedH);
      loop();
    } else {
      requestAnimationFrame(initDraw);
    }
  }
  initDraw();
  
  window.addEventListener("resize", () => {
    cachedFit = window.bkFitCanvas(canvas, requestedW, requestedH);
    if (!window.__loop && window.innerWidth >= 32 && window.innerHeight >= 32) {
      if (!loopId) {
        ctx.save();
        ctx.scale(cachedFit.scale, cachedFit.scale);
        loopFn(ctx, cachedFit.width, cachedFit.height);
        ctx.restore();
      }
    }
  });
  
  window.addEventListener("message", (event) => {
    if (!event.data) return;
    if (event.data.type === "bk:play") {
      window.__loop = true;
      if (!loopId) loopId = requestAnimationFrame(loop);
    } else if (event.data.type === "bk:pause") {
      window.__loop = false; // will stop at next frame
    }
  });
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
if (!window.bkSetupCalled) {
  function fallbackScale() {
    window.bkFitCanvas(document.getElementById("c"), 800, 500, { bitmap: false });
  }
  fallbackScale();
  window.addEventListener("resize", fallbackScale);
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

export { blockChrome, renderBlock, renderBlockInner };
