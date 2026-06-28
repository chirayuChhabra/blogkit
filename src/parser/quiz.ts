import type { QuizFile, QuizQuestion } from "../types.js";

export function parseQuizMarkdown(content: string): QuizFile {
	const lines = content.split("\n");
	const questions: QuizQuestion[] = [];

	let currentQ: Partial<QuizQuestion> | null = null;
	let options: string[] = [];
	let answerIndex = -1;
	let explanation: string[] = [];
	let state: "none" | "question" | "options" | "explanation" = "none";
	let questionNum = 0;

	const saveCurrentQuestion = () => {
		if (currentQ) {
			if (options.length < 2) {
				throw new Error(
					`Question ${questionNum} must have at least 2 options.`,
				);
			}
			if (answerIndex === -1) {
				throw new Error(
					`Question ${questionNum} is missing a correct answer (marked with '+').`,
				);
			}
			currentQ.options = options;
			currentQ.answer = answerIndex;
			if (explanation.length > 0) {
				currentQ.explanation = explanation.join("\n").trim();
			}
			questions.push(currentQ as QuizQuestion);
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		if (!trimmed) {
			if (state === "explanation") {
				explanation.push("");
			}
			continue;
		}

		// Check for new question (e.g. "## Question text")
		const qMatch = trimmed.match(/^##\s+(.*)/);
		if (qMatch) {
			saveCurrentQuestion();
			questionNum++;
			currentQ = { q: qMatch[1].trim() };
			options = [];
			answerIndex = -1;
			explanation = [];
			state = "question";
			continue;
		}

		if (!currentQ) continue;

		// Correct option: "++ "
		if (trimmed.startsWith("++ ")) {
			if (answerIndex !== -1) {
				throw new Error(
					`Question ${questionNum} has multiple correct answers.`,
				);
			}
			answerIndex = options.length;
			options.push(line.substring(line.indexOf("++ ") + 3).trim());
			state = "options";
			continue;
		}

		// Incorrect option: "-- "
		if (trimmed.startsWith("-- ")) {
			options.push(line.substring(line.indexOf("-- ") + 3).trim());
			state = "options";
			continue;
		}

		if (trimmed.startsWith(">")) {
			// Extract after the `>` (and optional space)
			const expText = trimmed.startsWith("> ")
				? trimmed.slice(2)
				: trimmed.slice(1);
			explanation.push(expText);
			state = "explanation";
			continue;
		}

		// Multiline support
		if (state === "question") {
			currentQ.q += "\n" + trimmed;
		} else if (state === "options" && options.length > 0) {
			options[options.length - 1] += "\n" + trimmed;
		} else if (state === "explanation") {
			explanation.push(trimmed);
		}
	}

	saveCurrentQuestion();

	return { questions };
}
