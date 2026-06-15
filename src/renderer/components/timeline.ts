import type { Chapter } from "../../types.js";
import { escAttr, escHtml } from "../blocks.js";

export function renderChapterTimeline(chapter: Chapter): string {
	const timelineHtml = `
<div class="bk-chapter-timeline-wrapper">
  <div class="bk-chapter-timeline">
    ${chapter.lessons
			.map(
				(lesson) => `
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
	return timelineHtml;
}

export const chapterStyles = `
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

.bk-timeline-card.bk-last-opened .bk-timeline-content {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 4px 12px rgba(0, 0, 0, 0.05);
}
.bk-timeline-card.bk-last-opened .bk-timeline-node {
  background: var(--accent);
  border-color: var(--accent);
}
.bk-timeline-card.bk-last-opened .bk-timeline-node::after {
  background: var(--paper);
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
