import * as fs from "fs";
import * as path from "path";
import type { BuildOptions, Lesson } from "../types";
import { escHtml } from "./blocks";
import type { NavItem } from "./utils";

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
