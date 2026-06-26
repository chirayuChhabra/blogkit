export function bkWireQuizzes() {
	document.addEventListener("click", (e) => {
		const btn = e.target.closest?.(".bk-opt");
		if (!btn) return;

		const question = btn.closest(".bk-question");
		if (!question) return;

		const qid = question.id;
		const quiz = question.closest(".bk-quiz");
		const dataEl = quiz ? quiz.querySelector(".bk-quiz-data") : null;
		let isCorrect = false;

		if (dataEl) {
			try {
				const answers = JSON.parse(dataEl.textContent || "[]");
				// qid is format "quiz-IDX-qQI"
				const match = qid.match(/-q(\d+)$/);
				if (match) {
					const qi = parseInt(match[1], 10);
					const optIdx = parseInt(btn.dataset.optIdx, 10);
					isCorrect = answers[qi] === optIdx;
				}
			} catch (_e) {
				console.warn("Failed to parse quiz answers from data element:", _e);
			}
		}

		question.querySelectorAll(".bk-opt").forEach((b) => {
			b.disabled = true; // Disable buttons for screen readers
			const optIdx = parseInt(b.dataset.optIdx, 10);
			// If we know the answer, highlight it
			if (dataEl) {
				try {
					const answers = JSON.parse(dataEl.textContent || "[]");
					const match = qid.match(/-q(\d+)$/);
					if (match && answers[parseInt(match[1], 10)] === optIdx) {
						b.classList.add("correct");
						return;
					}
				} catch (_e) {
					console.warn("Failed to parse quiz answers for highlighting:", _e);
				}
			}

			if (b === btn && isCorrect) {
				b.classList.add("correct");
			} else if (b === btn && !isCorrect) {
				b.classList.add("wrong");
			} else {
				b.classList.add("disabled");
			}
		});
		const exp = document.getElementById(`${qid}-exp`);
		if (exp) exp.hidden = false;
	});
}
