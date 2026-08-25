import katex from "katex";
import { marked, type Tokens } from "marked";
import { blockChrome } from "./chrome.js";

export {
	COMMON_LANGUAGES,
	ensureLanguageLoaded,
	initHighlighter,
	LANGUAGE_ALIASES,
	normalizeLanguage,
	preloadLanguagesFromMarkdown,
	shiki,
} from "./highlighter.js";

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
