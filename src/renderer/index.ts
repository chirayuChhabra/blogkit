import type { BuildOptions, Chapter, Lesson } from "../types.js";
import { escAttr, escHtml, renderBlock } from "./blocks.js";
import { renderPage } from "./html.js";
import type { NavItem } from "./utils.js";

// ─── Main render function ─────────────────────────────────────────────────────

export function render(lesson: Lesson, opts: BuildOptions = {}): string {
	const bodyItems: string[] = [];
	const structuredNavItems: NavItem[] = [];

	lesson.blocks.forEach((block, idx) => {
		const { html, navItems } = renderBlock(block, idx, opts);
		bodyItems.push(html);
		if (navItems) {
			structuredNavItems.push(...navItems);
		}
	});

	return renderPage(lesson, structuredNavItems, bodyItems.join("\n"), opts);
}

// ─── Chapter Rendering ────────────────────────────────────────────────────────

export function renderChapter(
	chapter: Chapter,
	opts: BuildOptions = {},
): string {
	const theme = opts.theme ?? "auto";
	const schemeAttr = `data-theme="${theme}"`;
	const preset = opts.preset ?? {};
	const layout = preset.layout ?? "lesson";
	const density = preset.density ?? "comfortable";
	const tone = preset.tone ?? "scholarly";
	const palette = opts.palette ?? "ink";

	const navHtml = chapter.lessons
		.map(
			(l) =>
				`<a href="${escAttr(l.meta.slug)}.html" class="bk-nav-item bk-nav-chapter">${escHtml(l.meta.title)}</a>`,
		)
		.join("\n");

	const timelineHtml = `
<div class="bk-chapter-path-wrapper" style="margin-top: 3rem;">
  <div class="bk-chapter-path">
    ${chapter.lessons
			.map(
				(lesson, idx) => `
      <a href="${escAttr(lesson.meta.slug)}.html" class="bk-lesson-card bk-status-${lesson.meta.status ?? "unread"}">
        <div class="bk-lesson-number">${String(idx + 1).padStart(2, "0")}</div>
        <div class="bk-lesson-content">
          <h3 class="bk-lesson-title" style="view-transition-name: title-${escAttr(lesson.meta.slug)}">${escHtml(lesson.meta.title)}</h3>
          ${lesson.meta.description ? `<p class="bk-lesson-desc">${escHtml(lesson.meta.description)}</p>` : ""}
        </div>
        <div class="bk-lesson-footer">
          <span class="bk-lesson-action">${lesson.meta.status === "read" ? "Read again" : "Start Lesson"} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></span>
        </div>
      </a>
      ${
				idx < chapter.lessons.length - 1
					? `
      <div class="bk-path-connector ${chapter.lessons[idx + 1].meta.status === "read" ? "bk-connector-read" : "bk-connector-unread"}">
        <div class="bk-connector-line"></div>
        <div class="bk-connector-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
      </div>`
					: `
      <div class="bk-path-connector ${lesson.meta.status === "read" ? "bk-connector-read" : "bk-connector-unread"}">
        <div class="bk-connector-line"></div>
        <div class="bk-connector-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
      </div>
      <a href="${(chapter.meta as { nextSlug?: string }).nextSlug ? `${escAttr((chapter.meta as { nextSlug?: string }).nextSlug || "")}.html` : "#"}" class="bk-path-terminal bk-terminal-next">
        <span class="bk-terminal-text">${(chapter.meta as { nextTitle?: string }).nextTitle ? `Next: ${escHtml((chapter.meta as { nextTitle?: string }).nextTitle || "")}` : "Next Chapter"}</span>
        <div class="bk-terminal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </a>
      `
			}
    `,
			)
			.join("")}
  </div>
</div>
<script>
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('js-visible');
            entry.target.classList.remove('js-hidden');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.bk-lesson-card, .bk-path-connector, .bk-path-terminal').forEach((el) => {
      el.classList.add('js-hidden');
      observer.observe(el);
    });
  }
</script>`;

	const chapterStyles = `
.bk-chapter-path-wrapper {
  position: relative;
  width: 100%;
  padding: 1rem 0 4rem 0;
  z-index: 1;
}

.bk-chapter-path {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: 700px;
  margin: 0 auto;
}

.bk-path-terminal {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 2.5rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 50px;
  color: var(--ink);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  z-index: 2;
  position: relative;
  transition: all 0.3s ease;
}

.bk-terminal-next {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, var(--paper));
  text-decoration: none !important;
  cursor: pointer;
}

.bk-terminal-next:hover {
  transform: translateY(-2px);
  background: var(--accent);
  color: var(--paper);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent);
}

.bk-terminal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bk-lesson-card {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  text-decoration: none !important;
  color: inherit;
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.01);
  overflow: hidden;
}

.bk-lesson-card:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
  box-shadow: 0 20px 40px rgba(0,0,0,0.06);
}

/* Subtle glow effect behind card on hover */
.bk-lesson-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px var(--accent);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.bk-lesson-card:hover::after {
  opacity: 0.1;
}

.bk-lesson-number {
  position: absolute;
  top: -1.5rem;
  right: 1.5rem;
  font-family: var(--font-display);
  font-size: 8rem;
  font-weight: 800;
  color: var(--line-strong);
  opacity: 0.05;
  line-height: 1;
  transition: all 0.4s ease;
  letter-spacing: -0.05em;
  pointer-events: none;
  z-index: 0;
}

.bk-lesson-card:hover .bk-lesson-number {
  color: var(--accent);
  opacity: 0.1;
  transform: translateY(8px);
}

.bk-lesson-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bk-lesson-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
  line-height: 1.3;
  transition: color 0.3s ease;
  padding-right: 4rem;
}

.bk-lesson-card:hover .bk-lesson-title {
  color: var(--accent);
}

.bk-lesson-desc {
  color: var(--muted);
  line-height: 1.6;
  font-size: 1.1rem;
  margin: 0;
  max-width: 90%;
}

.bk-lesson-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  transition: border-color 0.3s ease;
}

.bk-lesson-card:hover .bk-lesson-footer {
  border-color: color-mix(in srgb, var(--accent) 20%, transparent);
}

.bk-lesson-action {
  font-weight: 600;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  transition: gap 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.bk-lesson-card:hover .bk-lesson-action {
  gap: 0.8rem;
}

/* Status variants */
.bk-status-unread {
  opacity: 0.85;
}
.bk-status-unread .bk-lesson-title {
  color: color-mix(in srgb, var(--ink) 80%, transparent);
}
.bk-status-unread .bk-lesson-desc {
  color: color-mix(in srgb, var(--muted) 80%, transparent);
}
.bk-status-unread .bk-lesson-action {
  color: var(--muted);
}
.bk-status-unread:hover .bk-lesson-title {
  color: var(--ink);
}
.bk-status-unread:hover .bk-lesson-action {
  color: var(--accent);
}

/* Path Connector */
.bk-path-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
}

.bk-connector-line {
  width: 2px;
  height: 40px;
  background: var(--line-strong);
  border-radius: 2px;
}

.bk-connector-arrow {
  color: var(--line-strong);
  margin-top: -6px;
  background: var(--paper);
  border-radius: 50%;
  padding: 4px;
}

.bk-connector-read .bk-connector-line {
  background: var(--accent);
}
.bk-connector-read .bk-connector-arrow {
  color: var(--accent);
}

.bk-connector-unread {
  opacity: 0.4;
}
.bk-connector-unread .bk-connector-line {
  background: repeating-linear-gradient(to bottom, var(--line-strong) 0, var(--line-strong) 6px, transparent 6px, transparent 12px);
}

/* Scroll-driven animations */
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    .bk-lesson-card, .bk-path-connector, .bk-path-terminal {
      animation: slide-fade-in both cubic-bezier(0.16, 1, 0.3, 1);
      animation-timeline: view(block);
      animation-range: entry 5% cover 15%;
    }
    @keyframes slide-fade-in {
      0% { opacity: 0; transform: translateY(40px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  }
}

/* Fallback animation */
.bk-lesson-card.js-hidden, .bk-path-connector.js-hidden, .bk-path-terminal.js-hidden {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}
.bk-lesson-card.js-visible, .bk-path-connector.js-visible, .bk-path-terminal.js-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dark theme specific adjustments */
:root[data-theme="dark"] .bk-path-terminal {
  background: var(--panel);
}
:root[data-theme="dark"] .bk-terminal-next {
  background: color-mix(in srgb, var(--accent) 15%, var(--panel));
}
:root[data-theme="dark"] .bk-terminal-next:hover {
  background: var(--accent);
  color: var(--panel);
}
:root[data-theme="dark"] .bk-lesson-card {
  background: var(--panel);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
:root[data-theme="dark"] .bk-status-unread {
  background: color-mix(in srgb, var(--panel) 50%, transparent);
}
:root[data-theme="dark"] .bk-status-unread:hover {
  background: var(--panel);
}
:root[data-theme="dark"] .bk-connector-arrow {
  background: var(--panel);
}

@media (max-width: 600px) {
  .bk-lesson-card {
    padding: 1.5rem;
  }
  .bk-lesson-number {
    font-size: 5rem;
    top: -0.5rem;
    right: 1rem;
  }
  .bk-lesson-title {
    padding-right: 0;
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
<link rel="stylesheet" href="assets/theme.css">
<style>
${opts.font ? `:root { --font-sans: ${opts.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }` : ""}
${chapterStyles}
</style>
</head>
<body class="bk-layout-${layout} bk-density-${density} bk-tone-${tone}">
<div class="bk-shell">
  <aside class="bk-sidebar">
    <div class="bk-sidebar-inner">
      <div class="bk-sidebar-header">
        <div style="margin-top: 8px;"></div>
        <div class="bk-sidebar-title">${escHtml(chapter.meta.title)}</div>
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
               <button type="button" class="bk-segment-btn ${theme === "auto" ? "active" : !theme ? "active" : ""}" data-theme="auto" title="System" aria-label="System theme">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
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
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 12"></path></svg>
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
<script src="assets/app.js"></script>
</body>
</html>`;
}
