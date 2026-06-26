import { describe, expect, test } from "bun:test";
import { parseQuizMarkdown } from "../src/parser/quiz.js";

describe("Quiz Parser", () => {
	test("should parse a basic quiz", () => {
		const md = `
1. What is 2+2?
- 3
+ 4
- 5
> Math is fun!
`;
		const result = parseQuizMarkdown(md);
		expect(result.questions).toHaveLength(1);
		expect(result.questions[0].q).toBe("What is 2+2?");
		expect(result.questions[0].options).toEqual(["3", "4", "5"]);
		expect(result.questions[0].answer).toBe(1);
		expect(result.questions[0].explanation).toBe("Math is fun!");
	});

	test("should throw if multiple correct answers provided", () => {
		const md = `
1. Multiple answers
+ A
+ B
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/multiple correct answers/);
	});

	test("should throw if missing correct answer", () => {
		const md = `
1. No answers
- A
- B
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/missing a correct answer/);
	});

	test("should throw if less than 2 options", () => {
		const md = `
1. One option
+ A
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/at least 2 options/);
	});

	test("should handle multi-line question and options", () => {
		const md = `
1. Multi line
   question text
- Option
  continued
+ Option 2
> explanation line 1
> explanation line 2
`;
		const result = parseQuizMarkdown(md);
		expect(result.questions).toHaveLength(1);
		expect(result.questions[0].q).toBe("Multi line\nquestion text");
		expect(result.questions[0].options[0]).toBe("Option\ncontinued");
		expect(result.questions[0].options[1]).toBe("Option 2");
		expect(result.questions[0].explanation).toBe(
			"explanation line 1\nexplanation line 2",
		);
	});

	test("should ignore empty lines", () => {
		const md = `

1. Space question

- A

+ B

`;
		const result = parseQuizMarkdown(md);
		expect(result.questions).toHaveLength(1);
		expect(result.questions[0].options).toEqual(["A", "B"]);
	});

	test("should parse explanation without space after blockquote", () => {
		const md = `
1. Q
- A
+ B
>Expl
`;
		const result = parseQuizMarkdown(md);
		expect(result.questions[0].explanation).toBe("Expl");
	});
});
