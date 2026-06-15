import type {
	BuildOptions,
	QuizBlock,
	QuizFile,
	QuizQuestion,
} from "../../types.js";
import { escapeScriptJson, mdInline, mdToHtml } from "../markdown/index.js";
import { type NavItem, resolveContent } from "../utils.js";
import { escAttr, escHtml } from "./utils.js";

function renderQuestion(q: QuizQuestion, quizId: string, qi: number): string {
	const qid = `${quizId}-q${qi}`;
	const options = q.options
		.map(
			(opt, oi) => `
    <button class="bk-opt" data-opt-idx="${oi}">
      <span class="bk-opt-dot"></span><span class="bk-opt-text">${mdInline(opt)}</span>
    </button>`,
		)
		.join("");

	const expHtml = q.explanation
		? `<div class="bk-explanation" id="${qid}-exp" hidden>${mdToHtml(q.explanation).html}</div>`
		: "";

	return `
    <div class="bk-question" id="${qid}">
      <div class="bk-q-text">${mdToHtml(q.q).html}</div>
      <div class="bk-opts">${options}</div>
      ${expHtml}
    </div>`;
}

export function renderQuiz(
	block: QuizBlock,
	idx: number,
	options: BuildOptions,
): { html: string; navItems?: NavItem[] } {
	let quiz: QuizFile = { questions: [] };
	const rawJson = resolveContent(block.src, options, "json");
	try {
		const trimmed = rawJson.trim();
		if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
			throw new Error("Quiz file not found or invalid JSON format");
		}
		quiz = JSON.parse(trimmed);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (options.strict !== false) {
			throw new Error(`Invalid Quiz JSON for block ${idx + 1}: ${msg}`);
		}
		console.warn(`  ⚠ Invalid Quiz JSON for block ${idx + 1}:`, e);
		return {
			html: `<div class="bk-callout bk-callout--warning"><div class="bk-callout-icon"></div><div class="bk-callout-content"><div class="bk-callout-label">Quiz JSON Error</div><div class="bk-callout-body"><p>${escHtml(msg)}</p></div></div></div>`,
		};
	}

	return {
		html: `<div class="bk-quiz" id="quiz-${idx}">
          <div class="bk-quiz-head">
            <span>${escHtml(block.label ?? "Check your understanding")}</span>
            ${block.caption ? `<small>${mdInline(block.caption)}</small>` : ""}
          </div>
          <div class="bk-quiz-body">
            ${quiz.questions.map((q, qi) => renderQuestion(q, `quiz-${idx}`, qi)).join("\n")}
          </div>
          <script type="application/json" class="bk-quiz-data">${escapeScriptJson(quiz.questions.map((q) => q.answer))}</script>
        </div>`,
		navItems: [
			{
				id: `quiz-${idx}`,
				label: block.label ?? "Questions",
				kind: "quiz",
			},
		],
	};
}
