import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { BuildOptions, Lesson } from "../types.js";
import { escHtml } from "./blocks.js";
import type { NavItem } from "./utils.js";

// ─── Page shell ───────────────────────────────────────────────────────────────

function renderNavItem(item: NavItem): string {
	const kindClass =
		item.kind === "heading"
			? "bk-nav-heading"
			: item.kind === "quiz"
				? "bk-nav-quiz"
				: item.kind === "simulation"
					? "bk-nav-sim"
					: "bk-nav-sub";
	return `<a href="#${item.id}" class="bk-nav-item ${kindClass}" data-id="${item.id}">${escHtml(item.label)}</a>`;
}

function renderEndNav(lesson: Lesson): string {
	const { prevSlug, prevTitle, nextSlug, nextTitle } = lesson.meta;
	if (!prevSlug && !nextSlug) return "";

	return `<nav class="bk-end-nav" aria-label="Lesson navigation" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
    ${prevSlug ? `
    <a class="bk-end-link bk-end-link--prev" href="${prevSlug}.html">
      <span>Previous Lesson</span>
      <strong>${escHtml(prevTitle || "Previous")}</strong>
    </a>
    ` : `<div class="bk-end-link" style="visibility:hidden"></div>`}
    ${nextSlug ? `
    <a class="bk-end-link bk-end-link--next" href="${nextSlug}.html">
      <span>Next Lesson</span>
      <strong>${escHtml(nextTitle || "Next")}</strong>
    </a>
    ` : `<div class="bk-end-link" style="visibility:hidden"></div>`}
  </nav>`;
}

function renderPage(
	lesson: Lesson,
	navItems: NavItem[],
	bodyHtml: string,
	opts: BuildOptions,
): string {
	const theme = opts.theme ?? "light";
	const schemeAttr = `data-theme="${theme}"`;
	const preset = opts.preset ?? {};
	const layout = preset.layout ?? "lesson";
	const density = preset.density ?? "comfortable";
	const tone = preset.tone ?? "scholarly";
	const palette = opts.palette ?? "ink";
	const navHtml = navItems.map(renderNavItem).join("\n");
	const endNavHtml = renderEndNav(lesson);

	return `<!DOCTYPE html>
<html lang="en" data-palette="${palette}" ${schemeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(lesson.meta.title)}</title>
${lesson.meta.description ? `<meta name="description" content="${escHtml(lesson.meta.description)}">` : ""}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css">
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
        ${lesson.meta.parentSlug ? `<div style="margin-top: 8px;"><a href="${lesson.meta.parentSlug}.html" class="bk-back-link" aria-label="Back to Chapter" style="margin-bottom: 12px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>Back to Chapter</a></div>` : `<div style="margin-top: 8px;"></div>`}
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
          <div class="bk-theme-row">
            <span>Theme</span>
            <div class="bk-segmented-control" id="bk-theme-icons">
               <button type="button" class="bk-segment-btn ${theme === "light" ? "active" : ""}" data-theme="light" title="Light" aria-label="Light theme">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
               </button>
               <button type="button" class="bk-segment-btn ${theme === "dark" ? "active" : ""}" data-theme="dark" title="Dark" aria-label="Dark theme">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
               </button>
            </div>
          </div>
          <div class="bk-theme-row">
            <span>Palette</span>
            <div class="bk-segmented-control" id="bk-palette-icons">
               <button type="button" class="bk-segment-btn ${palette === "ink" ? "active" : ""}" data-palette="ink" title="Ink" aria-label="Ink palette">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
               </button>
               <button type="button" class="bk-segment-btn ${palette === "field" ? "active" : ""}" data-palette="field" title="Field" aria-label="Field palette">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
               </button>
               <button type="button" class="bk-segment-btn ${palette === "ember" ? "active" : ""}" data-palette="ember" title="Ember" aria-label="Ember palette">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
  <button class="bk-sidebar-collapse-floating" id="bk-sidebar-collapse" aria-label="Collapse sidebar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <main class="bk-main">
    <button class="bk-sidebar-expand" id="bk-sidebar-expand" type="button" aria-label="Expand sidebar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <article class="bk-content">
      <header class="bk-hero">
        <p class="bk-eyebrow">Interactive Lesson</p>
        <h1 style="view-transition-name: title-${lesson.meta.slug}">${escHtml(lesson.meta.title)}</h1>
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
	return fs.readFileSync(
		path.join(__dirname, "../styles/theme.css"),
		"utf-8",
	);
}

// ─── Client-side script ───────────────────────────────────────────────────────

function clientScript(): string {
	return fs.readFileSync(path.join(__dirname, "../client/app.js"), "utf-8");
}

export { clientScript, pageCSS, renderNavItem, renderPage };
