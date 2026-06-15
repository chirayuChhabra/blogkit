import DOMPurify from "isomorphic-dompurify";
import { marked } from "./math.js";

const domPurifyConfig = {
	USE_PROFILES: { html: true, mathMl: true, svg: true },
	ADD_TAGS: ["semantics", "annotation", "path"],
	ADD_ATTR: ["encoding", "d", "viewBox", "preserveAspectRatio"],
};

export function sanitizeHtml(htmlRaw: string): string {
	return DOMPurify.sanitize(htmlRaw, domPurifyConfig);
}

export function mdToHtml(md: string): {
	html: string;
	title: string;
	headings: { id: string; text: string; level: number }[];
} {
	let title = "";

	// Extract first H1 or H2 as title
	const titleMatch = md.match(/^(?:#|##)\s+(.+)$/m);
	if (titleMatch) {
		title = titleMatch[1].trim();
	}

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

	const htmlRaw = marked.parse(md, { renderer }) as string;
	const html = sanitizeHtml(htmlRaw);

	return { html, title, headings };
}

export function mdInline(text: string): string {
	const htmlRaw = marked.parseInline(text) as string;
	return sanitizeHtml(htmlRaw);
}
