import type { BuildOptions, Chapter, Lesson } from "../types.js";
import { escAttr, escHtml, renderBlock } from "./blocks.js";
import { clientScript, pageCSS, renderPage } from "./html.js"; // Used in renderChapter
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
	const theme = opts.theme ?? "light";
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
<div class="bk-chapter-timeline-wrapper">
  <div class="bk-chapter-timeline">
    ${chapter.lessons
		.map(
			(lesson, idx) => `
      <a href="${escAttr(lesson.meta.slug)}.html" class="bk-timeline-card bk-status-${lesson.meta.status ?? "unread"}">
        <div class="bk-timeline-node"></div>
        <div class="bk-timeline-content">
          <h3 class="bk-timeline-title" style="view-transition-name: title-${escAttr(lesson.meta.slug)}">${escHtml(lesson.meta.title)}</h3>
          ${lesson.meta.description ? `<p class="bk-timeline-desc">${escHtml(lesson.meta.description)}</p>` : ""}
          <span class="bk-timeline-action">${lesson.meta.status === "read" ? "Read again" : "Start Lesson"} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></span>
        </div>
      </a>
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
    document.querySelectorAll('.bk-timeline-card').forEach((el) => {
      el.classList.add('js-hidden');
      observer.observe(el);
    });
  }
</script>`;

	const chapterStyles = `
.bk-chapter-timeline-wrapper {
  position: relative;
  width: 100%;
  padding: 1rem 0;
  z-index: 1;
}

.bk-chapter-timeline {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 3rem 0;
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

/* Minimalist vertical connecting line */
.bk-chapter-timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 3rem;
  bottom: 3rem;
  width: 1px;
  background: var(--line);
  z-index: 0;
  transform: translateX(-50%);
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
  opacity: 1;
  transform: none;
}

/* Subtle scroll-driven animations */
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    .bk-timeline-card {
      animation-name: slide-fade-in;
      animation-fill-mode: both;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      animation-timeline: view(block);
      animation-range: entry 5% cover 20%;
    }
    @keyframes slide-fade-in {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  }
}

/* Fallback for browsers without animation-timeline support */
.bk-timeline-card.js-hidden {
  opacity: 0;
  transform: translateY(20px);
}
.bk-timeline-card.js-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.bk-timeline-node {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--paper);
  border: 1px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.bk-timeline-node::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  transition: all 0.3s ease;
}
.bk-timeline-card:hover .bk-timeline-node {
  background: var(--accent);
}
.bk-timeline-card:hover .bk-timeline-node::after {
  background: var(--paper);
}

.bk-timeline-content {
  background: var(--paper);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--line);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  flex: 1;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
.bk-timeline-card:hover .bk-timeline-content {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.bk-timeline-title {
  margin: 0 0 0.5rem 0;
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--ink);
  width: fit-content;
  transition: color 0.2s ease;
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
  font-weight: 500;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  align-self: flex-start;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
}
.bk-timeline-card:hover .bk-timeline-action {
  gap: 0.6rem;
  border-bottom-color: var(--accent);
}

.bk-status-unread .bk-timeline-node {
  border: 1px solid var(--line-strong);
}
.bk-status-unread .bk-timeline-node::after {
  background: var(--line-strong);
  transform: scale(0.8);
}
.bk-status-unread .bk-timeline-content {
  background: transparent;
  box-shadow: none;
  border: 1px solid transparent;
}
.bk-status-unread .bk-timeline-title {
  color: var(--muted);
}
.bk-status-unread .bk-timeline-desc {
  color: color-mix(in srgb, var(--muted) 80%, transparent);
}
.bk-status-unread .bk-timeline-action {
  color: var(--muted);
}
.bk-status-unread:hover .bk-timeline-node {
  border-color: var(--ink);
  background: var(--paper);
}
.bk-status-unread:hover .bk-timeline-node::after {
  background: var(--ink);
  transform: scale(1);
}
.bk-status-unread:hover .bk-timeline-content {
  background: var(--paper);
  border-color: var(--line);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
.bk-status-unread:hover .bk-timeline-title {
  color: var(--ink);
}
.bk-status-unread:hover .bk-timeline-action {
  color: var(--ink);
  border-bottom-color: var(--ink);
}



:root[data-theme="dark"] .bk-timeline-content {
  background: var(--panel);
}
:root[data-theme="dark"] .bk-status-unread .bk-timeline-content {
  background: transparent;
}
:root[data-theme="dark"] .bk-status-unread:hover .bk-timeline-content {
  background: var(--panel);
}

@media (max-width: 600px) {
  .bk-chapter-timeline::before {
    left: 16px;
  }
  .bk-timeline-card {
    gap: 1.5rem;
  }
  .bk-timeline-node {
    width: 32px;
    height: 32px;
  }
  .bk-timeline-node::after {
    width: 8px;
    height: 8px;
  }
  .bk-timeline-content {
    padding: 1.5rem;
    border-radius: 10px;
  }
  .bk-timeline-title {
    font-size: 1.4rem;
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
<script>
${clientScript()}
</script>
</body>
</html>`;
}
