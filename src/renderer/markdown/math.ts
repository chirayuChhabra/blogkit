import hljs from "highlight.js";
import katex from "katex";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { blockChrome } from "./chrome.js";

marked.use(
	markedHighlight({
		langPrefix: "hljs language-",
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
	}),
);

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
	renderer(token: any) {
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
	renderer(token: any) {
		return katex.renderToString(token.text, {
			throwOnError: false,
			displayMode: false,
		});
	},
};

marked.use({ extensions: [blockMathExtension, inlineMathExtension] });

export { marked };
