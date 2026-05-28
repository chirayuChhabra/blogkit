import type { BuildOptions, Chapter, Lesson, Course } from "../types";
import { escAttr, escHtml, renderBlock } from "./blocks";
import { clientScript, pageCSS, renderPage } from "./html"; // Used in renderChapter
import type { NavItem } from "./utils";

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

export function renderChapter(
	chapter: Chapter,
	opts: BuildOptions = {},
): string {
	const theme = opts.theme ?? "auto";
	const schemeAttr = theme === "auto" ? "" : `data-theme="${theme}"`;
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

@media (prefers-color-scheme: dark) {
  .bk-timeline-content {
    background: var(--panel);
  }
  .bk-status-unread .bk-timeline-content {
    background: transparent;
  }
  .bk-status-unread:hover .bk-timeline-content {
    background: var(--panel);
  }
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
        <div class="bk-sidebar-title" style="margin-top: 8px;">${escHtml(chapter.meta.title)}</div>
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

// ─── Course Rendering ─────────────────────────────────────────────────────────

export function renderCourse(
	course: Course,
	opts: BuildOptions = {},
): string {
	const theme = opts.theme ?? "auto";
	const schemeAttr = theme === "auto" ? "" : `data-theme="${theme}"`;
	const preset = opts.preset ?? {};
	const layout = preset.layout ?? "lesson";
	const density = preset.density ?? "comfortable";
	const tone = preset.tone ?? "scholarly";
	const palette = opts.palette ?? "ink";

	const navHtml = course.chapters
		.map(
			(c) =>
				`<a href="${escAttr(c.meta.slug)}.html" class="bk-nav-item bk-nav-chapter">${escHtml(c.meta.title)}</a>`,
		)
		.join("\n");

	const mapWidth = 600;
	const nodeSpacingY = 160;
	const numChapters = course.chapters.length;
	const totalHeight = Math.max(800, numChapters * nodeSpacingY + 200);

	// Deterministic random
	let seed = 12345;
	function random() {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	}

	let currentX = mapWidth / 2;
	const nodes = [];
	let activeNodeFound = false;

	for (let i = 0; i < numChapters; i++) {
		const chapter = course.chapters[i];
		const y = totalHeight - 100 - i * nodeSpacingY;

		if (i > 0) {
			const dir = (i % 2 === 0) ? -1 : 1; // force alternate sides
			const offset = 80 + random() * 80;
			currentX = mapWidth / 2 + dir * offset;
		}

		const status = chapter.meta.status || "locked";
		if (status === "active") activeNodeFound = true;

		nodes.push({
			x: currentX,
			y,
			chapter,
			status,
			isActive: status === "active"
		});
	}

	let pathD = "";
	let activePathD = "";
	let hasActivePath = true;

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (i === 0) {
			pathD += `M ${node.x},${node.y} `;
			activePathD += `M ${node.x},${node.y} `;
		} else {
			const prev = nodes[i - 1];
			const cpY = (prev.y + node.y) / 2;
			const curve = `C ${prev.x},${cpY} ${node.x},${cpY} ${node.x},${node.y} `;
			pathD += curve;
			
			if (hasActivePath) {
				activePathD += curve;
			}
		}
		if (node.isActive) {
			hasActivePath = false;
		}
	}

	// If no active node, we assume we haven't started, or we finished. 
	// If the last one isn't completed, and no active found, maybe just highlight none.
	if (!activeNodeFound) {
		activePathD = ""; // No active path if no active node found
	}

	const courseHtml = `
<div class="bk-course-map-container" style="height: ${totalHeight}px;">
  <svg class="bk-course-map-svg" viewBox="0 0 ${mapWidth} ${totalHeight}" preserveAspectRatio="xMidYMid meet">
    <path d="${pathD}" stroke="var(--line)" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${activePathD}" stroke="var(--accent)" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  
  ${nodes.map(n => `
    <a href="${escAttr(n.chapter.meta.slug)}.html" class="bk-course-node bk-status-${n.status}" style="left: calc(50% - ${mapWidth/2}px + ${n.x}px); top: ${n.y}px;">
      <div class="bk-course-node-circle"></div>
      <div class="bk-course-node-label">
        <div class="bk-course-node-title">${escHtml(n.chapter.meta.title)}</div>
      </div>
    </a>
  `).join("")}
</div>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const activeNode = document.querySelector('.bk-status-active');
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'auto', block: 'center' });
    } else {
      // Scroll to bottom (start)
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
</script>`;

	const courseStyles = `
.bk-course-map-container {
  position: relative;
  width: 100%;
  max-width: ${mapWidth}px;
  margin: 0 auto;
  overflow: visible;
}

.bk-course-map-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bk-course-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none !important;
  z-index: 1;
}

.bk-course-node-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--paper);
  border: 4px solid var(--line);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bk-course-node-circle::after {
  content: '';
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--line);
  transition: all 0.3s ease;
}

.bk-course-node-label {
  position: absolute;
  top: 100%;
  margin-top: 8px;
  white-space: nowrap;
  background: var(--paper);
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid var(--line);
  opacity: 0.9;
  transition: all 0.3s ease;
}

.bk-course-node-title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--ink);
}

/* Status variants */
.bk-status-completed .bk-course-node-circle {
  border-color: var(--accent);
}
.bk-status-completed .bk-course-node-circle::after {
  background: var(--accent);
}

.bk-status-active .bk-course-node-circle {
  border-color: var(--accent);
  transform: scale(1.15);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 0 0 8px color-mix(in srgb, var(--accent) 20%, transparent);
  animation: bk-pulse 2s infinite cubic-bezier(0.66, 0, 0, 1);
}
.bk-status-active .bk-course-node-circle::after {
  background: var(--accent);
}
.bk-status-active .bk-course-node-label {
  opacity: 1;
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.bk-status-locked .bk-course-node-circle {
  background: var(--panel);
  border-color: var(--line);
  box-shadow: none;
}
.bk-status-locked .bk-course-node-circle::after {
  background: var(--line);
  opacity: 0.3;
}
.bk-status-locked .bk-course-node-title {
  color: var(--muted);
}

/* Hover effects */
.bk-course-node:hover:not(.bk-status-locked) .bk-course-node-circle {
  transform: scale(1.1);
}
.bk-status-active:hover .bk-course-node-circle {
  transform: scale(1.2);
}

@keyframes bk-pulse {
  0% { box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 0 0 0 color-mix(in srgb, var(--accent) 40%, transparent); }
  70% { box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 0 0 20px color-mix(in srgb, var(--accent) 0%, transparent); }
  100% { box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 0 0 0 color-mix(in srgb, var(--accent) 0%, transparent); }
}

@media (max-width: 768px) {
  .bk-course-map-svg {
    transform: scaleX(0.8);
  }
}
`;

	return `<!DOCTYPE html>
<html lang="en" data-palette="${palette}" ${schemeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(course.meta.title)}</title>
${course.meta.description ? `<meta name="description" content="${escHtml(course.meta.description)}">` : ""}
${opts.head ?? ""}
<style>
${opts.font ? `:root { --font-sans: ${opts.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }` : ""}
${pageCSS()}
${courseStyles}
</style>
</head>
<body class="bk-layout-${layout} bk-density-${density} bk-tone-${tone}">
<div class="bk-shell">
  <aside class="bk-sidebar">
    <div class="bk-sidebar-inner">
      <div class="bk-sidebar-header">
        <div class="bk-sidebar-title" style="margin-top: 8px;">${escHtml(course.meta.title)}</div>
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
    <article class="bk-content" style="max-width: 1000px; margin: 0 auto; overflow: hidden;">
      <header class="bk-hero" style="border-bottom: none;">
        <p class="bk-eyebrow">Course</p>
        <h1>${escHtml(course.meta.title)}</h1>
        ${course.meta.description ? `<p class="bk-deck">${escHtml(course.meta.description)}</p>` : ""}
      </header>
      ${courseHtml}
    </article>
  </main>
</div>
<script>
${clientScript()}
</script>
</body>
</html>`;
}

