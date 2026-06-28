import { describe, expect, test } from "bun:test";
import { parseQuizMarkdown } from "../src/parser/quiz.js";

describe("Quiz Parser", () => {
	test("should parse a basic quiz", () => {
		const md = `
## What is 2+2?
-- 3
++ 4
-- 5

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
## Multiple answers
++ A
++ B
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/multiple correct answers/);
	});

	test("should throw if missing correct answer", () => {
		const md = `
## No answers
-- A
-- B
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/missing a correct answer/);
	});

	test("should throw if less than 2 options", () => {
		const md = `
## One option
++ A
`;
		expect(() => parseQuizMarkdown(md)).toThrow(/at least 2 options/);
	});

	test("should handle multi-line question and options", () => {
		const md = `
## Multi line
   question text
-- Option
   continued
++ Option 2

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

	test("should handle indented options and explanations", () => {
		const md = `
# my quiz

## what do you mean by superQuiz?
-- idk
++ something
-- maybe
-- else

> Because etc

## What else?E
-- wedont know
++ somthign
-- cant say
-- maybe

> no needed exp
`;
		const result = parseQuizMarkdown(md);
		expect(result.questions).toHaveLength(2);
		expect(result.questions[0].q).toBe("what do you mean by superQuiz?");
		expect(result.questions[0].options).toEqual(["idk", "something", "maybe", "else"]);
		expect(result.questions[0].answer).toBe(1);
		expect(result.questions[0].explanation).toBe("Because etc");
		
		expect(result.questions[1].q).toBe("What else?E");
		expect(result.questions[1].options).toEqual(["wedont know", "somthign", "cant say", "maybe"]);
		expect(result.questions[1].answer).toBe(1);
		expect(result.questions[1].explanation).toBe("no needed exp");
	});

	test("should ignore empty lines", () => {
		const md = `

## Space question

-- A

++ B

`;
		const result = parseQuizMarkdown(md);
		expect(result.questions).toHaveLength(1);
		expect(result.questions[0].options).toEqual(["A", "B"]);
	});

	test("should parse explanation without space after blockquote", () => {
		const md = `
## Q
-- A
++ B
>Expl
`;
		const result = parseQuizMarkdown(md);
		expect(result.questions[0].explanation).toBe("Expl");
	});


});
