import katex from "katex";
import { marked, type Tokens } from "marked";
import { blockChrome } from "./chrome.js";
import { createHighlighter, type Highlighter } from "shiki";

export let shiki: Highlighter;

export async function initHighlighter() {
	if (!shiki) {
		shiki = await createHighlighter({
			themes: ["github-dark", "github-light"],
			langs: [
				"javascript",
				"typescript",
				"json",
				"html",
				"css",
				"bash",
				"rust",
				"markdown",
				"yaml",
			],
		});
	}
}

const renderer = {
	code({ text, lang }: Tokens.Code) {
		const language = lang || "text";
		if (!shiki) {
			console.warn(
				"Shiki highlighter not initialized. Code block will not be highlighted.",
			);
			return `<pre><code>${text}</code></pre>`;
		}

		try {
			return shiki.codeToHtml(text, {
				lang: language,
				themes: {
					light: "github-light",
					dark: "github-dark",
				},
			});
		} catch (_e) {
			return `<pre><code>${text}</code></pre>`;
		}
	},
};

marked.use({ renderer });

const blockMathExtension = {
	name: "blockMath",
	level: "block",
	start(src: string) {
		return src.match(/^[ \t]*\$\$/m)?.index;
	},
	tokenizer(src: string) {
		const rule = /^[ \t]*\$\$([\s\S]+?)\$\$/;
		const match = rule.exec(src);
		if (match) {
			return {
				type: "blockMath",
				raw: match[0],
				text: match[1],
			};
		}
	},
	renderer(token: Tokens.Generic) {
		const rendered = katex.renderToString(token.text, {
			throwOnError: false,
			displayMode: true,
		});
		return blockChrome(
			"LaTeX",
			undefined,
			undefined,
			`<div class="bk-latex-block">${rendered}</div>`,
			"violet",
			false,
		);
	},
};

const inlineMathExtension = {
	name: "inlineMath",
	level: "inline",
	start(src: string) {
		return src.match(/\$(?!\s)/)?.index;
	},
	tokenizer(src: string) {
		const rule = /^\$(?!\s)([^$\n]+?)(?<!\s)\$/;
		const match = rule.exec(src);
		if (match) {
			return {
				type: "inlineMath",
				raw: match[0],
				text: match[1],
			};
		}
	},
	renderer(token: Tokens.Generic) {
		return katex.renderToString(token.text, {
			throwOnError: false,
			displayMode: false,
		});
	},
};

marked.use({ extensions: [blockMathExtension, inlineMathExtension] });

export { marked };
